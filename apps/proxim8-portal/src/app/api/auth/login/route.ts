import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";
import { isValidSolanaAddress } from "@/utils/walletUtils";

/**
 * Helper to validate a Solana wallet address format
 */
function isValidSolanaWalletAddress(address: string): boolean {
  return isValidSolanaAddress(address);
}

/**
 * Login handler - verify signature and issue JWT token
 * @route POST /api/auth/login
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, signature, message } = body;

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate wallet address format before sending to server
    if (!isValidSolanaWalletAddress(walletAddress)) {
      console.error(
        `[API Route] Invalid wallet address format: ${walletAddress}`
      );
      return NextResponse.json(
        {
          error:
            "Invalid wallet address format. Please connect a valid Solana wallet.",
          success: false,
        },
        { status: 400 }
      );
    }

    console.log(`[API Route] Calling backend auth endpoint for login`);
    console.log(`[API Route] Wallet address: ${walletAddress.slice(0, 8)}...`);

    try {
      // Build the login endpoint URL
      const loginEndpoint = `${API_BASE_URL}/auth/login`;
      console.log(`[API Route] Using endpoint: ${loginEndpoint}`);

      // Create headers with API key - PRODUCTION READY (no insecure fallbacks)
      const apiKey = process.env.API_KEY;

      if (!apiKey) {
        console.error(
          "[API Route] API_KEY environment variable not configured"
        );
        return NextResponse.json(
          { error: "Server configuration error", success: false },
          { status: 500 }
        );
      }

      const requestHeaders = {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      };

      console.log(`[API Route] Using API key: ${apiKey.substring(0, 8)}...`);
      console.log(`[API Route] Request headers:`, {
        ...requestHeaders,
        "X-API-Key": "[REDACTED]",
      });

      const response = await fetch(loginEndpoint, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      console.log(`[API Route] Auth response status: ${response.status}`);

      // Check if we got a valid response
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Authentication failed";
        let errorData = null;

        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the response as JSON, use the status text
          errorMessage = `Authentication failed: ${response.status} ${response.statusText}`;
        }

        console.error(`[API Route] Login error: ${errorMessage}`, errorData);

        if (response.status === 404) {
          console.error("[API Route] 404 error - endpoint not found");
          return NextResponse.json(
            {
              error: "Authentication endpoint not available",
              success: false,
              hint: "The server might be misconfigured or down",
              endpoint: loginEndpoint,
            },
            { status: 503 } // Service unavailable instead of 404
          );
        }

        return NextResponse.json(
          { error: errorMessage, success: false },
          { status: response.status }
        );
      }

      // Ensure we get valid JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[API Route] Backend did not return JSON");
        return NextResponse.json(
          { error: "Invalid response from server", success: false },
          { status: 500 }
        );
      }

      const data = await response.json();
      console.log(
        `[API Route] Got successful auth response for ${walletAddress.slice(0, 8)}...`,
        "Full data from backend:",
        data
      );

      if (!data.token) {
        console.error("[API Route] No token in response");
        return NextResponse.json(
          { error: "Invalid authentication response", success: false },
          { status: 500 }
        );
      }

      // Construct the user object for the client store based on available data
      const userForClient = {
        walletAddress: data.walletAddress,
        isAdmin: data.isAdmin || false,
        // Add other fields if AuthUser expects them and they are in `data`
        // For example, if AuthUser has an 'id', and data.id exists:
        // id: data.id
      };

      // Set HttpOnly cookie with the token
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      };

      const responseHeaders = new Headers();

      // Properly format the cookie with URL encoding for the token value
      const cookieString = [
        `authToken=${encodeURIComponent(data.token)}`,
        `HttpOnly`,
        `Path=/`,
        `Max-Age=${7 * 24 * 60 * 60}`,
        `SameSite=Lax`,
        ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
      ].join("; ");

      responseHeaders.append("Set-Cookie", cookieString);

      // Also include the token in the response for client-side usage
      return NextResponse.json(
        {
          token: data.token, // Return token for the client to store in localStorage
          walletAddress: data.walletAddress, // Keep for direct access
          isAdmin: data.isAdmin || false, // Keep for direct access
          user: userForClient, // Pass the constructed user object
          success: true,
        },
        {
          status: 200,
          headers: responseHeaders,
        }
      );
    } catch (error) {
      console.error("[API Route] Error connecting to backend service:", error);
      return NextResponse.json(
        {
          error:
            "Could not connect to authentication service. Please try again later.",
          success: false,
          backendError: true,
        },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("[API Route] Error during login processing:", err);
    return NextResponse.json(
      { error: "Login request processing failed", success: false },
      { status: 500 }
    );
  }
}
