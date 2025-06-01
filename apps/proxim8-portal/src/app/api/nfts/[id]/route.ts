import { NextRequest, NextResponse } from "next/server";
import { getNFT } from "@/services/nft";

/**
 * Get NFT by ID
 * @route GET /api/nfts/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] GET /api/nfts/${params.id} - Raw ID received`);

    // Decode the ID from URL encoding
    const decodedId = decodeURIComponent(params.id);
    console.log(`[API] Decoded NFT ID: ${decodedId}`);

    console.log(`[API] Calling server getNFT with ID: ${decodedId}`);
    const nft = await getNFT(decodedId);
    console.log(`[API] getNFT result:`, nft ? "NFT found" : "NFT not found");

    if (!nft) {
      console.error(`[API] NFT not found for ID: ${decodedId}`);
      return NextResponse.json({ error: "NFT not found" }, { status: 404 });
    }

    console.log(`[API] Successfully fetched NFT: ${nft.name}`);
    return NextResponse.json(nft);
  } catch (error) {
    console.error(`[API] Error fetching NFT for ID ${params.id}:`, error);
    return NextResponse.json({ error: "Failed to fetch NFT" }, { status: 500 });
  }
}
