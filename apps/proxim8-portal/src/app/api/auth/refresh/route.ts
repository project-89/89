import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current token from cookies
    const authToken = request.cookies.get("authToken")?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "No token to refresh" },
        { status: 401 }
      );
    }

    console.log("[API Route] Refreshing authentication token");

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error("[API Route] API_KEY environment variable not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Call the backend refresh endpoint
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        "X-API-Key": apiKey,
      },
    });

    if (!response.ok) {
      console.log(`[API Route] Token refresh failed: ${response.status}`);

      // If refresh fails, clear the cookie
      const headers = new Headers();
      headers.append(
        "Set-Cookie",
        `authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
      );

      return NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401, headers }
      );
    }

    const data = await response.json();

    if (!data.token) {
      console.error("[API Route] No token in refresh response");
      return NextResponse.json(
        { error: "Invalid refresh response" },
        { status: 500 }
      );
    }

    console.log("[API Route] Token refreshed successfully");

    const responseHeaders = new Headers();

    // Properly format the cookie with URL encoding for the token value
    const cookieString = [
      `authToken=${encodeURIComponent(data.token)}`,
      `HttpOnly`,
      `Path=/`,
      `Max-Age=${7 * 24 * 60 * 60}`,
      `SameSite=Strict`,
      ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; ");

    responseHeaders.append("Set-Cookie", cookieString);

    return NextResponse.json(
      {
        success: true,
        token: data.token,
        walletAddress: data.walletAddress,
        isAdmin: data.isAdmin,
      },
      {
        status: 200,
        headers: responseHeaders,
      }
    );
  } catch (error) {
    console.error("[API Route] Error refreshing token:", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 }
    );
  }
}
