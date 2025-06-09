import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering for authenticated endpoints
export const dynamic = "force-dynamic";

/**
 * Get claimable mission lore for a specific NFT
 * @route GET /api/lore/nft/:nftId/claimable-mission-lore
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { nftId: string } }
) {
  // Get the auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;

  if (!authToken) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const { nftId } = params;

  if (!nftId) {
    return NextResponse.json(
      { success: false, error: "NFT ID is required" },
      { status: 400 }
    );
  }

  try {
    // Forward the request to the Express server
    const response = await fetch(`${API_BASE_URL}/lore/nft/${nftId}/claimable-mission-lore`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        "X-API-Key": process.env.API_KEY || "proxim8-dev-key",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Server error" }));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || errorData.message || `Server error: ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error fetching claimable mission lore for NFT ${nftId}:`, err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch claimable mission lore" },
      { status: 500 }
    );
  }
}