import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";
import { cookies } from "next/headers"; // Import cookies

/**
 * Get NFTs for a specific wallet address (NOW AN AUTHENTICATED ROUTE)
 * @route GET /api/nft/[walletAddress]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  const walletAddressFromParams = params.walletAddress;
  console.log(
    `[API Route] NFT: Attempting to fetch NFTs for wallet: ${walletAddressFromParams}`
  );

  const cookieStore = cookies();
  const authTokenCookie = cookieStore.get("authToken");

  if (!authTokenCookie || !authTokenCookie.value) {
    console.warn(
      "[API Route] NFT: Auth token cookie not found. Denying access."
    );
    return NextResponse.json(
      { error: "Unauthorized: Missing authentication token" },
      { status: 401 }
    );
  }

  const token = authTokenCookie.value;
  console.log("[API Route] NFT: Auth token found.");

  // It's good practice to verify the token here if you have a secret,
  // or at least ensure the walletAddress from the token matches params.walletAddress
  // For now, we'll assume the main backend does heavier validation.
  // Example: const decodedToken = jwt.verify(token, YOUR_JWT_SECRET);
  // if (decodedToken.walletAddress !== walletAddressFromParams) return 403;

  try {
    const queryParams = new URLSearchParams({
      filterByCollection: "true",
    }).toString();

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("[API Route] NFT: Missing API_KEY environment variable");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const backendUrl = `${API_BASE_URL}/nft/${walletAddressFromParams}?${queryParams}`;
    console.log(`[API Route] NFT: Request URL to main backend: ${backendUrl}`);

    const backendHeaders: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      Authorization: `Bearer ${token}`, // Add the JWT Bearer token
    };

    console.log(
      "[API Route] NFT: Headers being sent to main backend:",
      backendHeaders
    );

    const response = await fetch(backendUrl, {
      next: { revalidate: 60 },
      headers: backendHeaders,
    });

    console.log(
      `[API Route] NFT: Main backend response status: ${response.status}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[API Route] NFT: Main backend failed to fetch NFTs: ${response.status} ${response.statusText}. Body: ${errorText}`
      );
      if (response.status === 404) {
        return NextResponse.json([]);
      }
      // Return the actual error and status from the backend if not 404
      return NextResponse.json(
        {
          error: `Main backend error: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const nfts = data.nfts || [];
    console.log(
      `[API Route] NFT: Successfully fetched ${nfts.length} NFTs from main backend.`
    );

    return NextResponse.json(nfts);
  } catch (err) {
    console.error("[API Route] NFT: Error fetching NFTs:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch NFTs", details: errorMessage },
      { status: 500 }
    );
  }
}
