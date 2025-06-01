import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";

/**
 * Get a specific pipeline configuration
 * @route GET /api/pipeline/configs/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json(
      { error: "Pipeline configuration ID is required" },
      { status: 400 }
    );
  }

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
    const response = await fetch(`${API_BASE_URL}/pipeline/configs/${id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Pipeline configuration not found" },
          { status: 404 }
        );
      }

      const errorData = await response.json();
      return NextResponse.json(
        {
          error: errorData.message || "Failed to fetch pipeline configuration",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error fetching pipeline configuration ${id}:`, err);
    return NextResponse.json(
      { error: "Failed to fetch pipeline configuration" },
      { status: 500 }
    );
  }
}

/**
 * Update a specific pipeline configuration
 * @route PUT /api/pipeline/configs/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json(
      { error: "Pipeline configuration ID is required" },
      { status: 400 }
    );
  }

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

    // Forward the request to the backend API
    const response = await fetch(`${API_BASE_URL}/pipeline/configs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Pipeline configuration not found" },
          { status: 404 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          { error: "You don't have permission to update this configuration" },
          { status: 403 }
        );
      }

      const errorData = await response.json();
      return NextResponse.json(
        {
          error: errorData.message || "Failed to update pipeline configuration",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error updating pipeline configuration ${id}:`, err);
    return NextResponse.json(
      { error: "Failed to update pipeline configuration" },
      { status: 500 }
    );
  }
}

/**
 * Delete a specific pipeline configuration
 * @route DELETE /api/pipeline/configs/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json(
      { error: "Pipeline configuration ID is required" },
      { status: 400 }
    );
  }

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
    const response = await fetch(`${API_BASE_URL}/pipeline/configs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Pipeline configuration not found" },
          { status: 404 }
        );
      }

      if (response.status === 403) {
        return NextResponse.json(
          { error: "You don't have permission to delete this configuration" },
          { status: 403 }
        );
      }

      const errorData = await response.json();
      return NextResponse.json(
        {
          error: errorData.message || "Failed to delete pipeline configuration",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Error deleting pipeline configuration ${id}:`, err);
    return NextResponse.json(
      { error: "Failed to delete pipeline configuration" },
      { status: 500 }
    );
  }
}
