import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering for authenticated endpoints
export const dynamic = "force-dynamic";

/**
 * Deploy a mission
 * @route POST /api/missions/[missionId]/deploy
 * @body { proxim8Id: string, approach: 'low' | 'medium' | 'high', missionType?: string, timelineNode?: string }
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

  try {
    const body = await request.json();

    // Forward the request to the Express server
    const response = await fetch(
      `${API_BASE_URL}/missions/${params.missionId}/deploy`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
          "X-API-Key": process.env.API_KEY || "proxim8-dev-key",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Server error" }));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || `Server error: ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error deploying mission:", err);
    return NextResponse.json(
      { success: false, error: "Failed to deploy mission" },
      { status: 500 }
    );
  }
}