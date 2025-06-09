import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering for authenticated endpoints
export const dynamic = "force-dynamic";

/**
 * Deploy a training mission
 * @route POST /api/training/missions/:missionId/deploy
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { missionId: string } }
) {
  // Get the auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;

  if (!authToken) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const { missionId } = params;

  if (!missionId) {
    return NextResponse.json(
      { success: false, error: "Mission ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { proxim8Id, approach } = body;

    // Validate required fields
    if (!proxim8Id || !approach) {
      return NextResponse.json(
        { success: false, error: "Proxim8 ID and approach are required" },
        { status: 400 }
      );
    }

    // Validate approach
    if (!['low', 'medium', 'high'].includes(approach)) {
      return NextResponse.json(
        { success: false, error: "Invalid approach. Must be low, medium, or high" },
        { status: 400 }
      );
    }

    // Forward the request to the unified missions endpoint
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}/deploy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "X-API-Key": process.env.API_KEY || "proxim8-dev-key",
      },
      body: JSON.stringify({
        proxim8Id,
        approach,
        missionType: 'training', // Add mission type for the unified endpoint
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Server error" }));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || errorData.message || `Server error: ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error deploying mission ${missionId}:`, err);
    return NextResponse.json(
      { success: false, error: "Failed to deploy mission" },
      { status: 500 }
    );
  }
}