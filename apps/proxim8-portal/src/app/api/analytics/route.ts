import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

// Force dynamic rendering since methods use cookies for authentication
export const dynamic = "force-dynamic";

/**
 * Track analytics event
 * @route POST /api/analytics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventData } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "Event type is required" },
        { status: 400 }
      );
    }

    // Get the auth token from cookies (optional)
    const authToken = request.cookies.get("authToken")?.value;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/analytics/track`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventType,
        eventData: eventData || {},
        timestamp: new Date().toISOString(),
        source: "web",
        // Include user agent info
        userAgent: request.headers.get("user-agent") || "",
        referer: request.headers.get("referer") || "",
        // Include IP with disclaimer that it will be anonymized
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to track analytics event" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error tracking analytics event:", err);
    return NextResponse.json(
      { error: "Failed to track analytics event" },
      { status: 500 }
    );
  }
}

/**
 * Get analytics data (admin only)
 * @route GET /api/analytics
 */
export async function GET(request: NextRequest) {
  // Get the auth token from cookies
  const authToken = request.cookies.get("authToken")?.value;

  if (!authToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const type = searchParams.get("type") || "overview";

  try {
    // Build query params
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    queryParams.append("type", type);

    // Forward the request to the backend API
    const response = await fetch(
      `${API_BASE_URL}/analytics/data?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 403) {
      return NextResponse.json(
        { error: "You don't have permission to access analytics data" },
        { status: 403 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch analytics data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching analytics data:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
