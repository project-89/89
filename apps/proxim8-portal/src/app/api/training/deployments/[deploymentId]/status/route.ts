import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering for authenticated endpoints
export const dynamic = "force-dynamic";

/**
 * Get deployment status
 * @route GET /api/training/deployments/:deploymentId/status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { deploymentId: string } }
) {
  // Get the auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;

  if (!authToken) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const { deploymentId } = params;

  if (!deploymentId) {
    return NextResponse.json(
      { success: false, error: "Deployment ID is required" },
      { status: 400 }
    );
  }

  try {
    // Forward the request to the unified missions endpoint
    const response = await fetch(`${API_BASE_URL}/missions/deployments/${deploymentId}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "X-API-Key": process.env.API_KEY || "proxim8-dev-key",
      },
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
    console.error(`Error fetching deployment status ${deploymentId}:`, err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deployment status" },
      { status: 500 }
    );
  }
}