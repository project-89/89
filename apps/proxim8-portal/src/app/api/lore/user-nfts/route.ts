import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

/**
 * Get all lore for a specific user's NFTs
 * @route GET /api/lore/user-nfts
 */
export async function GET(request: NextRequest) {
  try {
    // Get JWT token from cookies and decode it
    const authTokenCookie = request.cookies.get("authToken")?.value;
    const authToken = authTokenCookie
      ? decodeURIComponent(authTokenCookie)
      : null;

    if (!authToken) {
      console.log("[API Route] No authentication token");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("[API] Fetching all lore for authenticated user");

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(
        "[User NFTs Lore] API_KEY environment variable not configured"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Forward the request to the server API with JWT authentication
    const response = await fetch(`${API_BASE_URL}/lore/user-nfts`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
    });

    console.log(`[API] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[API] Error from backend:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch user NFT lore" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API] Successfully fetched ${data.length || 0} lore entries`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching user NFT lore:", error);
    return NextResponse.json(
      { error: "Failed to fetch user NFT lore" },
      { status: 500 }
    );
  }
}
