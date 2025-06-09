import { NextRequest, NextResponse } from "next/server";
import { updateLore } from "@/services/lore";

/**
 * Update lore by lore ID
 * @route PUT /api/lore/[loreId]/put
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { loreId: string } }
) {
  try {
    // Decode the ID from URL encoding
    const decodedId = decodeURIComponent(params.loreId);
    const body = await request.json();

    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const updated = await updateLore(decodedId, {
      title: body.title,
      content: body.content,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating lore:", error);
    return NextResponse.json(
      { error: "Failed to update lore" },
      { status: 500 }
    );
  }
}
