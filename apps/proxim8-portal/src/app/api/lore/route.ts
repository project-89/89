import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering since POST method uses cookies for authentication
export const dynamic = "force-dynamic";

/**
 * Get lore content with optional filtering
 * @route GET /api/lore
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nftId = searchParams.get("nftId");
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  // Build query string
  let queryString = `page=${page}&limit=${limit}`;
  if (nftId) {
    queryString += `&nftId=${nftId}`;
  }

  try {
    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/lore?${queryString}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error("Failed to fetch lore content");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching lore:", err);
    return NextResponse.json(
      { error: "Failed to fetch lore content" },
      { status: 500 }
    );
  }
}

/**
 * Create new lore content
 * @route POST /api/lore
 */
export async function POST(request: NextRequest) {
  // Get the auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;

  if (!authToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { nftId, content, title } = body;

    if (!nftId || !content) {
      return NextResponse.json(
        { error: "NFT ID and content are required" },
        { status: 400 }
      );
    }

    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/lore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        nftId,
        content,
        title: title || "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to create lore" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error creating lore:", err);
    return NextResponse.json(
      { error: "Failed to create lore content" },
      { status: 500 }
    );
  }
}
