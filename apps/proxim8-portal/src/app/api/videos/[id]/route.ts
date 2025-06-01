import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Get video details by ID
 * @route GET /api/videos/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json(
      { error: "Video ID is required" },
      { status: 400 }
    );
  }

  // Get the auth token from cookies (optional - some videos might be public)
  const authToken = request.cookies.get("authToken")?.value;

  const headers: HeadersInit = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      headers,
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      if (response.status === 403) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      throw new Error("Failed to fetch video");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error fetching video ${id}:`, err);
    return NextResponse.json(
      { error: "Failed to fetch video details" },
      { status: 500 }
    );
  }
}
