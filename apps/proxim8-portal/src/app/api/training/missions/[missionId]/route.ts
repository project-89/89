import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering for authenticated endpoints
export const dynamic = "force-dynamic";

/**
 * Get specific mission details with deployment info
 * @route GET /api/training/missions/:missionId
 */
export async function GET(
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
    // Forward the request to the unified missions endpoint with type hint
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}?type=training`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "X-API-Key": process.env.API_KEY || "proxim8-dev-key",
      },
      next: { revalidate: 0 }, // Don't cache mission details
    });

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
    console.error(`Error fetching mission ${missionId}:`, err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch mission details" },
      { status: 500 }
    );
  }
}