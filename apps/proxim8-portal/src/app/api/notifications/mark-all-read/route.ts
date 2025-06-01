import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

/**
 * Mark all notifications as read for the current user
 * @route POST /api/notifications/mark-all-read
 */
export async function POST(request: NextRequest) {
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

    console.log("[Notifications] Marking all notifications as read");

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(
        "[Mark All Read] API_KEY environment variable not configured"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Forward the request to the server API with JWT authentication
    const response = await fetch(
      `${API_BASE_URL}/notifications/mark-all-read`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      console.error(`[Notifications] Server API error: ${response.status}`);
      return NextResponse.json(
        { error: `Server returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(
      `[Notifications] Marked ${data.modifiedCount || 0} notifications as read`
    );

    return NextResponse.json({
      modifiedCount: data.modifiedCount || 0,
      success: true,
    });
  } catch (error) {
    console.error(
      "[Notifications] Error processing mark-all-read request:",
      error
    );
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}
