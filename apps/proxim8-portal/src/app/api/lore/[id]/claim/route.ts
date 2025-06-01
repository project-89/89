import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Claim a lore entry
 * @route POST /api/lore/[id]/claim
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loreId = params.id;

    // Get JWT token from cookies and decode it
    const authTokenCookie = request.cookies.get("authToken")?.value;
    const authToken = authTokenCookie
      ? decodeURIComponent(authTokenCookie)
      : null;

    if (!authToken) {
      console.log("[API Route] No authentication token for lore claim");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json().catch(() => ({}));

    console.log(`[API Route] Claiming lore: ${loreId}`);

    // Get API key - PRODUCTION READY (no insecure fallbacks)
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error(`[API Route] Missing API_KEY environment variable`);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Forward the request to the server API with JWT authentication
    const response = await fetch(`${API_BASE_URL}/lore/${loreId}/claim`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    console.log(`[API Route] Backend response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[API Route] Error from backend:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to claim lore" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Route] Successfully claimed lore`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Route] Error claiming lore:", error);
    return NextResponse.json(
      { error: "Failed to claim lore" },
      { status: 500 }
    );
  }
}
