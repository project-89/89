import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

/**
 * Auth status handler - check authentication and get user info
 * @route GET /api/auth/status
 *
 * Returns:
 * - { authenticated: false } if not logged in (200)
 * - { authenticated: true, walletAddress, isAdmin } if logged in (200)
 * - Error responses for service issues (503/500)
 */
export async function GET(request: NextRequest) {
  try {
    // Get the token from cookies and decode it
    const authTokenCookie = request.cookies.get("authToken")?.value;
    const authToken = authTokenCookie
      ? decodeURIComponent(authTokenCookie)
      : null;

    // If no token, user is not authenticated
    if (!authToken) {
      return NextResponse.json(
        {
          authenticated: false,
          message: "Not authenticated",
          walletAddress: null,
          isAdmin: false,
        },
        { status: 200 } // Return 200 for normal "not logged in" state
      );
    }

    try {
      // Get API key - PRODUCTION READY (no insecure fallbacks)
      const apiKey = process.env.API_KEY;

      if (!apiKey) {
        console.error(
          "[Auth Status] API_KEY environment variable not configured"
        );
        return NextResponse.json(
          {
            authenticated: false,
            error: "Server configuration error",
            walletAddress: null,
            isAdmin: false,
          },
          { status: 500 }
        );
      }

      // Call backend to validate token and get user details
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-API-Key": apiKey,
        },
      });

      if (!response.ok) {
        console.log(`[Auth Status] Invalid token, status: ${response.status}`);

        // If token is invalid, clear it
        const headers = new Headers();
        headers.append(
          "Set-Cookie",
          `authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${
            process.env.NODE_ENV === "production" ? "; Secure" : ""
          }`
        );

        return NextResponse.json(
          {
            authenticated: false,
            message: "Invalid authentication token",
            walletAddress: null,
            isAdmin: false,
          },
          {
            status: 200, // Return 200 for normal "not logged in" state
            headers,
          }
        );
      }

      // Parse response data
      const data = await response.json();

      return NextResponse.json({
        authenticated: true,
        walletAddress: data.user?.walletAddress || data.walletAddress,
        isAdmin: data.user?.isAdmin || data.isAdmin || false,
        message: "Authenticated successfully",
      });
    } catch (err) {
      console.error(
        "[Auth Status] Error connecting to authentication service:",
        err
      );
      return NextResponse.json(
        {
          authenticated: false,
          error: "Authentication service unavailable",
          walletAddress: null,
          isAdmin: false,
        },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("[Auth Status] Error checking auth status:", err);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Failed to validate authentication",
        walletAddress: null,
        isAdmin: false,
      },
      { status: 500 }
    );
  }
}
