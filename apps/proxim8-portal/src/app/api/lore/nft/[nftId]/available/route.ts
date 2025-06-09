import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Check if unclaimed lore is available for a specific NFT
 * @route GET /api/lore/nft/[nftId]/available
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { nftId: string } }
) {
  try {
    const { nftId } = params;

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(
        "[Available Lore] API_KEY environment variable not configured"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get the auth token from cookies
    const authToken = request.cookies.get("authToken")?.value;

    const headers: HeadersInit = {
      "X-API-Key": apiKey,
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Forward the request to the backend API
    const response = await fetch(
      `${API_BASE_URL}/lore/nft/${nftId}/available`,
      {
        headers: headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[API] Failed to check available lore: ${response.status}`,
        errorText
      );

      // If 404, it means no lore exists for this NFT
      if (response.status === 404) {
        return NextResponse.json({
          hasUnclaimedLore: false,
          unclaimedCount: 0,
        });
      }

      throw new Error(`Failed to check available lore: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error checking available lore:", error);
    return NextResponse.json(
      { error: "Failed to check available lore" },
      { status: 500 }
    );
  }
}
