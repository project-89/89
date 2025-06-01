import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Get public NFTs
 * @route GET /api/nfts
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "12";

  try {
    const response = await fetch(
      `${API_BASE_URL}/nfts/public?page=${page}&limit=${limit}`,
      { next: { revalidate: 60 } } // Cache data for 60 seconds
    );

    if (!response.ok) {
      throw new Error("Failed to fetch NFTs");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching NFTs:", err);
    return NextResponse.json(
      { error: "Failed to fetch NFTs" },
      { status: 500 }
    );
  }
}
