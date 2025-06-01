import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Get pipeline configurations
 * @route GET /api/pipeline/configs
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
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";

  try {
    // Forward the request to the backend API
    const response = await fetch(
      `${API_BASE_URL}/pipeline/configs?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: errorData.message || "Failed to fetch pipeline configurations",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching pipeline configurations:", err);
    return NextResponse.json(
      { error: "Failed to fetch pipeline configurations" },
      { status: 500 }
    );
  }
}

/**
 * Create a new pipeline configuration
 * @route POST /api/pipeline/configs
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
    const { name, description, steps, isPublic } = body;

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "Name and valid steps array are required" },
        { status: 400 }
      );
    }

    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/pipeline/configs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name,
        description: description || "",
        steps,
        isPublic: isPublic === true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: errorData.message || "Failed to create pipeline configuration",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error creating pipeline configuration:", err);
    return NextResponse.json(
      { error: "Failed to create pipeline configuration" },
      { status: 500 }
    );
  }
}
