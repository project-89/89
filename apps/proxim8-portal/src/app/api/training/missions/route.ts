import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering for authenticated endpoints
export const dynamic = "force-dynamic";

/**
 * Get all training missions with user progress
 * @route GET /api/training/missions
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
    // Forward the request to the unified missions endpoint with type=training
    const response = await fetch(`${API_BASE_URL}/missions?type=training`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "X-API-Key": process.env.API_KEY || "proxim8-dev-key",
      },
      next: { revalidate: 0 }, // Don't cache training mission data
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
    console.error("Error fetching training missions:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch training missions" },
      { status: 500 }
    );
  }
}