import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Save a video to user's library
 * @route POST /api/videos/[id]/save
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
    const response = await fetch(`${API_BASE_URL}/videos/${id}/save`, {
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
          { error: "Video already saved" },
          { status: 409 }
        );
      }

      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to save video" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error saving video ${id}:`, err);
    return NextResponse.json(
      { error: "Failed to save video" },
      { status: 500 }
    );
  }
}

/**
 * Remove a video from user's library
 * @route DELETE /api/videos/[id]/save
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
    const response = await fetch(`${API_BASE_URL}/videos/${id}/save`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Video not found or not saved" },
          { status: 404 }
        );
      }

      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to unsave video" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error unsaving video ${id}:`, err);
    return NextResponse.json(
      { error: "Failed to unsave video" },
      { status: 500 }
    );
  }
}
