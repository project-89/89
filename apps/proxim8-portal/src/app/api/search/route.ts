import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering since we optionally use cookies for authentication
export const dynamic = "force-dynamic";

// Define types for the API response items
interface SearchResultItem {
  id: string;
  type: string;
  title?: string;
  name?: string;
  description?: string;
  image?: string;
  thumbnail?: string;
  createdAt?: string;
  created_at?: string;
  creator?: string;
  owner?: string;
  author?: string;
  [key: string]: unknown; // Allow for additional properties with unknown type
}

/**
 * Search across NFTs, videos, and lore content
 * @route GET /api/search
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") || "all"; // Can be 'all', 'nft', 'video', 'lore'
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Get the auth token from cookies (optional - for including user-specific results)
    const authToken = request.cookies.get("authToken")?.value;

    const headers: HeadersInit = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Build query params
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);
    queryParams.append("type", type);
    queryParams.append("page", page);
    queryParams.append("limit", limit);

    // Forward the request to the backend API
    const response = await fetch(
      `${API_BASE_URL}/search?${queryParams.toString()}`,
      {
        headers,
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch search results");
    }

    const data = await response.json();

    // Format the response to match the frontend expected format
    const formattedResults = data.results.map((item: SearchResultItem) => {
      // Create a result URL based on item type
      let url = "/";
      if (item.type === "nft") {
        url = `/nfts/${item.id}`;
      } else if (item.type === "video") {
        url = `/videos/${item.id}`;
      } else if (item.type === "lore") {
        url = `/lore/${item.id}`;
      }

      // Return formatted item
      return {
        id: item.id,
        type: item.type,
        title: item.title || item.name || "Untitled",
        description: item.description || "",
        image: item.image || item.thumbnail || "/images/placeholder.jpg",
        createdAt:
          item.createdAt || item.created_at || new Date().toISOString(),
        creator: item.creator || item.owner || item.author || undefined,
        url: url,
      };
    });

    return NextResponse.json({ results: formattedResults });
  } catch (err) {
    console.error("Error fetching search results:", err);
    return NextResponse.json(
      { error: "Failed to fetch search results", results: [] },
      { status: 500 }
    );
  }
}
