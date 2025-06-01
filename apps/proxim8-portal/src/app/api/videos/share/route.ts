import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Share a video to social media
 * @route POST /api/videos/share
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
    const { videoId, platform, message } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ["twitter", "discord", "facebook", "instagram"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        {
          error:
            "Invalid platform. Valid options: twitter, discord, facebook, instagram",
        },
        { status: 400 }
      );
    }

    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/videos/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        videoId,
        platform,
        message: message || "",
      }),
    });

    if (!response.ok) {
      // Handle specific error responses
      if (response.status === 404) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      if (response.status === 403) {
        return NextResponse.json(
          { error: "You don't have permission to share this video" },
          { status: 403 }
        );
      }

      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to share video" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error sharing video:", err);
    return NextResponse.json(
      { error: "Failed to share video" },
      { status: 500 }
    );
  }
}
