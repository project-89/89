import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Like a video
 * @route POST /api/videos/[id]/like
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // Get the auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;

  if (!authToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/videos/${id}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      if (response.status === 409) {
        return NextResponse.json(
          { error: "Video already liked" },
          { status: 409 }
        );
      }

      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to like video" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error liking video ${id}:`, err);
    return NextResponse.json(
      { error: "Failed to like video" },
      { status: 500 }
    );
  }
}

/**
 * Unlike a video
 * @route DELETE /api/videos/[id]/like
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // Get the auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;

  if (!authToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/videos/${id}/like`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Video not found or not liked" },
          { status: 404 }
        );
      }

      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to unlike video" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error unliking video ${id}:`, err);
    return NextResponse.json(
      { error: "Failed to unlike video" },
      { status: 500 }
    );
  }
}
