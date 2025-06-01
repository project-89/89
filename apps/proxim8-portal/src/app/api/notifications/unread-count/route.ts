import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

/**
 * Get unread notification count for the current user
 * @route GET /api/notifications/unread-count
 */
export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookies
    const authToken = request.cookies.get("authToken")?.value;

    if (!authToken) {
      console.log("[Notifications] No authentication token");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("[Notifications] Fetching unread count from server");

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(
        "[Unread Count] API_KEY environment variable not configured"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Forward the request to the server API with JWT authentication
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      console.error(`[Notifications] Server API error: ${response.status}`);
      return NextResponse.json(
        { error: `Server returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Notifications] Unread count: ${data.count || 0}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Notifications] Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Failed to get unread notification count" },
      { status: 500 }
    );
  }
}
