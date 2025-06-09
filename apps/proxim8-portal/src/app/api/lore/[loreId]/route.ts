import { NextRequest, NextResponse } from "next/server";
import { getLore } from "@/services/lore";

/**
 * Get lore by lore ID
 * @route GET /api/lore/[loreId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { loreId: string } }
) {
  try {
    // Decode the ID from URL encoding
    const decodedId = decodeURIComponent(params.loreId);
    const lore = await getLore(parseInt(decodedId));

    if (!lore) {
      return NextResponse.json({ error: "Lore not found" }, { status: 404 });
    }

    return NextResponse.json(lore);
  } catch (error) {
    console.error("Error fetching lore:", error);
    return NextResponse.json(
      { error: "Failed to fetch lore" },
      { status: 500 }
    );
  }
}
