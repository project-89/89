import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering for authenticated endpoints
export const dynamic = "force-dynamic";

/**
 * Get all missions with optional type filtering
 * @route GET /api/missions?type=training|timeline|critical|event|all
 */
export async function GET(request: NextRequest) {
  // Get the auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;

  if (!authToken) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    // Forward the request to the Express server
    const response = await fetch(`${API_BASE_URL}/missions?type=${type}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "X-API-Key": process.env.API_KEY || "proxim8-dev-key",
      },
      next: { revalidate: 0 }, // Don't cache mission data
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
    console.error("Error fetching missions:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch missions" },
      { status: 500 }
    );
  }
}