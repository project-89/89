import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware to enforce wallet connection for specific routes
 * This runs before the request reaches API handlers
 */
export function middleware(request: NextRequest) {
  // Only check for wallet address on API routes related to videos and NFTs
  if (
    request.nextUrl.pathname.startsWith("/api/videos/") ||
    request.nextUrl.pathname.startsWith("/api/nfts/")
  ) {
    const walletAddress = request.headers.get("x-wallet-address");

    // If wallet address is missing, return 401
    if (!walletAddress) {
      console.warn(
        `Unauthorized request without wallet address: ${request.nextUrl.pathname}`
      );
      return NextResponse.json(
        { error: "Wallet connection required" },
        { status: 401 }
      );
    }
  }

  // Continue with the request
  return NextResponse.next();
}

// Only run middleware on API routes that need wallet address
export const config = {
  matcher: ["/api/videos/:path*", "/api/nfts/:path*"],
};
