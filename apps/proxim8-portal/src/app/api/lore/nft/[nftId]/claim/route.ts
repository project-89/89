import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Claim lore for an NFT by NFT ID
 * @route POST /api/lore/nft/[nftId]/claim
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { nftId: string } }
) {
  try {
    const { nftId } = params;

    // Get JWT token from cookies and decode it
    const authTokenCookie = request.cookies.get("authToken")?.value;
    const authToken = authTokenCookie
      ? decodeURIComponent(authTokenCookie)
      : null;

    if (!authToken) {
      console.log("[API Route] No authentication token for NFT lore claim");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log(`[API Route] Claiming lore for NFT: ${nftId}`);

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(`[API Route] Missing API_KEY environment variable`);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Forward the request to the server API with JWT authentication
    // This calls the claimLore function in loreController which handles NFT ID claims
    const response = await fetch(`${API_BASE_URL}/lore/nft/${nftId}/claim`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({}),
    });

    console.log(`[API Route] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[API Route] Error from backend:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to claim lore for NFT" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Route] Successfully claimed lore for NFT ${nftId}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Route] Error claiming lore for NFT:", error);
    return NextResponse.json(
      { error: "Failed to claim lore for NFT" },
      { status: 500 }
    );
  }
}
