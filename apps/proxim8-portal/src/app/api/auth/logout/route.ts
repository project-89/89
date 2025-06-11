import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";
import { cookies } from "next/headers";

/**
 * Logout handler - invalidate JWT token and clear cookies
 * @route POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken");

    if (!token) {
      return NextResponse.json(
        { success: true, message: "No active session to clear." },
        { status: 200 }
      );
    }

    // Clear the authToken cookie by setting its value to empty and maxAge to 0
    cookieStore.set("authToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0, // Expire immediately
      sameSite: "lax",
    });

    console.log("[API Logout] Auth token cookie cleared.");
    return NextResponse.json(
      { success: true, message: "Successfully logged out." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API Logout] Error during logout:", error);
    return NextResponse.json(
      { success: false, message: "Logout failed." },
      { status: 500 }
    );
  }
}
