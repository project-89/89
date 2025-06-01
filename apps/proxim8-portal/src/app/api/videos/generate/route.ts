import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Generate a video from an NFT using pipeline configuration
 * @route POST /api/videos/generate
 */
export async function POST(request: NextRequest) {
  console.log("[Video Generation API] Received request to generate video");

  try {
    // Get JWT token from cookies
    const authToken = request.cookies.get("authToken")?.value;

    if (!authToken) {
      console.error("[Video Generation API] Missing authentication token");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nftId, prompt } = body;
    console.log(`[Video Generation API] Request data - NFT ID: ${nftId}`);

    if (!nftId) {
      console.error("[Video Generation API] Missing NFT ID");
      return NextResponse.json(
        { error: "NFT ID is required" },
        { status: 400 }
      );
    }

    if (!prompt) {
      console.error("[Video Generation API] Missing prompt");
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Log the API base URL we're using
    console.log(`[Video Generation API] Using API base URL: ${API_BASE_URL}`);

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(
        "[Video Generation API] API_KEY environment variable not configured"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create headers with JWT token for the backend request
    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      Authorization: `Bearer ${authToken}`,
    };

    console.log(
      "[Video Generation API] Sending authenticated request to backend"
    );

    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/video/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        nftId,
        prompt,
      }),
    });

    console.log(
      `[Video Generation API] Backend response status: ${response.status}`
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      console.error("[Video Generation API] Error from backend:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Video generation failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[Video Generation API] Successfully generated video:", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error generating video:", err);
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 }
    );
  }
}
