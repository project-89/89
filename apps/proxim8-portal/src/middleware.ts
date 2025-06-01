import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// Define protected routes that require authentication
const PROTECTED_ROUTES = ["/profile", "/admin", "/wallet"];

// Define routes that need auth but shouldn't redirect
const AUTH_OPTIONAL_ROUTES = ["/pipeline", "/videos/create"];

// Define admin-only routes
const ADMIN_ONLY_ROUTES = ["/admin"];

// Methods that require CSRF protection
const CSRF_PROTECTED_METHODS = ["POST", "PUT", "DELETE", "PATCH"];

/**
 * Middleware for Next.js
 * Handles:
 * 1. Authentication protection for routes
 * 2. CSRF protection for mutating requests
 * 3. Admin-only route protection
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add CSRF protection for mutating methods
  if (CSRF_PROTECTED_METHODS.includes(request.method)) {
    const csrfFromCookie = request.cookies.get("csrf_token")?.value;
    const csrfFromHeader = request.headers.get("x-csrf-token");

    // If this is an API route that requires CSRF protection
    if (
      pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth/login")
    ) {
      // Check if CSRF token is valid
      if (
        !csrfFromCookie ||
        !csrfFromHeader ||
        csrfFromCookie !== csrfFromHeader
      ) {
        return new NextResponse(
          JSON.stringify({ error: "Invalid CSRF token" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // For non-API routes, ensure there's a CSRF token in the cookie for the client
  if (!pathname.startsWith("/api/")) {
    // If CSRF token doesn't exist, set a new one
    if (!request.cookies.has("csrf_token")) {
      const csrfToken = uuidv4();
      response.cookies.set("csrf_token", csrfToken, {
        httpOnly: false, // Client needs to read this
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
  }

  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path allows optional auth
  const isAuthOptionalRoute = AUTH_OPTIONAL_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current path is an admin-only route
  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // If it's not a protected route or is an auth-optional route, return response
  if (!isProtectedRoute && !isAuthOptionalRoute) {
    return response;
  }

  // Get the auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;

  // If no auth token is present, redirect to the login page for protected routes
  if (!authToken) {
    if (isProtectedRoute) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    } else {
      // For auth-optional routes, continue even without auth
      return response;
    }
  }

  // For admin routes, verify admin status
  if (isAdminRoute) {
    try {
      // Verify admin status by calling the admin check API
      const adminResponse = await fetch(
        `${request.nextUrl.origin}/api/auth/check-admin`,
        {
          headers: {
            Cookie: `authToken=${authToken}`,
          },
        }
      );

      if (!adminResponse.ok) {
        // If not an admin, redirect to the home page
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (err) {
      // If there's an error, redirect to the home page
      console.error("Error checking admin status:", err);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // For all other routes, validate the auth token
  try {
    // Verify token is valid
    const validationResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/validate`,
      {
        headers: {
          Cookie: `authToken=${authToken}`,
        },
      }
    );

    // If token is invalid and this is a protected route, redirect to login
    if (!validationResponse.ok && isProtectedRoute) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      redirectUrl.searchParams.set("expired", "true");
      return NextResponse.redirect(redirectUrl);
    }
  } catch (err) {
    console.error("Error validating auth token:", err);
    // Continue anyway - let the API handle auth errors
  }

  // Continue with therequest
  return response;
}

// Configure matcher for routes that should invoke this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Static files (/_next/*)
     * - Public files (/public/*)
     * - favicon.ico
     * - /wallet-callback (this should be handled by the page itself)
     */
    "/((?!_next|public|favicon.ico|wallet-callback).*)",
  ],
};
