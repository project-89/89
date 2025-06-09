import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Get only claimed lore for a specific NFT
 * @route GET /api/lore/nft/[nftId]/claimed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { nftId: string } }
) {
  try {
    const { nftId } = params;

    console.log(`[API] Fetching claimed lore for NFT ID: ${nftId}`);

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(
        "[Claimed Lore] API_KEY environment variable not configured"
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
    const response = await fetch(`${API_BASE_URL}/lore/nft/${nftId}/claimed`, {
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[API] Failed to fetch claimed lore: ${response.status}`,
        errorText
      );

      // If 404, it means no claimed lore was found
      if (response.status === 404) {
        return NextResponse.json([]);
      }

      throw new Error(`Failed to fetch claimed lore: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[API] Successfully fetched ${data.length} claimed lore items`);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error fetching claimed lore:", error);
    return NextResponse.json(
      { error: "Failed to fetch claimed lore" },
      { status: 500 }
    );
  }
}
