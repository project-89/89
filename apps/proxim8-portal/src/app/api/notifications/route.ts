import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

/**
 * Get notifications for the current user
 * @route GET /api/notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookies
    const authToken = request.cookies.get("authToken")?.value;

    if (!authToken) {
      console.log("[Notifications] No authentication token, returning error");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the request URL and extract the search params
    const { searchParams } = new URL(request.url);

    // Build the query string from search params
    const queryParams = Array.from(searchParams.entries())
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    const endpoint = `${API_BASE_URL}/notifications`;
    const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;

    console.log(
      `[Notifications] Forwarding authenticated request to server: ${url}`
    );

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(
        "[Notifications API] API_KEY environment variable not configured"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Forward the request to the server API with JWT authentication
    const response = await fetch(url, {
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
        { error: `Server returned ${response.status}`, success: false },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(
      `[Notifications] Received ${data.length || 0} notifications from server`
    );

    return NextResponse.json({
      notifications: data || [],
      success: true,
    });
  } catch (error) {
    console.error("[Notifications] Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to get notifications", success: false },
      { status: 500 }
    );
  }
}
