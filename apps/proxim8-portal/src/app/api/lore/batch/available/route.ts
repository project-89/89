import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering since POST method uses cookies for authentication
export const dynamic = "force-dynamic";

/**
 * Batch check for unclaimed lore across multiple NFTs
 * Reduces API calls from n individual requests to 1 batch request
 * @route POST /api/lore/batch/available
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nftIds } = body;

    if (!Array.isArray(nftIds) || nftIds.length === 0) {
      return NextResponse.json(
        { error: "nftIds array is required" },
        { status: 400 }
      );
    }

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(
        "[Batch Available Lore] API_KEY environment variable not configured"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get the auth token from cookies
    const authToken = request.cookies.get("authToken")?.value;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/lore/batch/available`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ nftIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[API] Failed to check batch lore availability: ${response.status}`,
        errorText
      );

      // If 404, return empty object (no lore for any NFTs)
      if (response.status === 404) {
        return NextResponse.json({});
      }

      throw new Error(`Failed to check batch lore availability: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API] Error checking batch lore availability:", error);
    return NextResponse.json(
      { error: "Failed to check batch lore availability" },
      { status: 500 }
    );
  }
}