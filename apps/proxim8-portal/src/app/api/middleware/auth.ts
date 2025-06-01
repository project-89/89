import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Auth middleware for API routes
 * Validates the auth token and provides consistent error handling
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
): Promise<NextResponse> {
  // Get auth token from cookie
  const authToken = req.cookies.get("authToken")?.value;

  // If no token is present, return unauthorized
  if (!authToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Validate the token by calling the auth validation endpoint
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      // If token validation fails, clear the cookie and return unauthorized
      const headers = new Headers();
      headers.append(
        "Set-Cookie",
        `authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
      );

      return NextResponse.json(
        { error: "Invalid or expired authentication" },
        { status: 401, headers }
      );
    }

    // Parse and return user data
    const userData = await response.json();

    // Pass the request and user data to the handler
    return handler(req, userData);
  } catch (error) {
    console.error("[Auth Middleware] Error validating token:", error);
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }
}

/**
 * Admin middleware for API routes
 * Ensures the user has admin privileges
 */
export async function withAdmin(
  req: NextRequest,
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (req, user) => {
    // Check if user has admin privileges
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Admin privileges required" },
        { status: 403 }
      );
    }

    // Pass the request and user data to the handler
    return handler(req, user);
  });
}

/**
 * Optional auth middleware for API routes
 * Attempts to authenticate but still allows the request to proceed
 */
export async function withOptionalAuth(
  req: NextRequest,
  handler: (req: NextRequest, user: any | null) => Promise<NextResponse>
): Promise<NextResponse> {
  // Get auth token from cookie
  const authToken = req.cookies.get("authToken")?.value;

  // If no token is present, continue without auth
  if (!authToken) {
    return handler(req, null);
  }

  try {
    // Validate the token by calling the auth validation endpoint
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      // If token validation fails, continue without auth
      return handler(req, null);
    }

    // Parse and return user data
    const userData = await response.json();

    // Pass the request and user data to the handler
    return handler(req, userData);
  } catch (error) {
    console.error("[Auth Middleware] Error validating token:", error);
    // On error, continue without auth
    return handler(req, null);
  }
}
