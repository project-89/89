import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/config";
import { cookies } from "next/headers"; // Import cookies

// Proxim8 collection address
const PROXIM8_COLLECTION = '5QBfYxnihn5De4UEV3U1To4sWuWoWwHYJsxpd3hPamaf';

/**
 * Get NFTs for a specific wallet address (NOW AN AUTHENTICATED ROUTE)
 * @route GET /api/nft/[walletAddress]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress: walletAddressFromParams } = await params;
  console.log(
    `[API Route] NFT: Attempting to fetch NFTs for wallet: ${walletAddressFromParams}`
  );

  const cookieStore = await cookies();
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

    const backendUrl = `${API_BASE_URL}/nfts/user/${walletAddressFromParams}?${queryParams}`;
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

    const responseData = await response.json();
    
    // Log the full response structure for debugging
    console.log(
      `[API Route] NFT: Full response structure:`,
      JSON.stringify(responseData, null, 2).substring(0, 500) + '...'
    );
    
    // Handle the wrapped response format from Express server
    let nfts = [];
    if (responseData.success && responseData.data) {
      // Express server wraps response in { success: true, data: { nfts: [...] } }
      nfts = responseData.data.nfts || [];
    } else {
      // Fallback to direct nfts array
      nfts = responseData.nfts || [];
    }
    
    console.log(
      `[API Route] NFT: Successfully fetched ${nfts.length} NFTs from main backend.`
    );
    
    // Log first NFT structure for debugging
    if (nfts.length > 0) {
      console.log(
        `[API Route] NFT: First NFT structure:`,
        JSON.stringify(nfts[0], null, 2)
      );
    }

    // Transform NFTs to match the expected frontend structure
    const transformedNfts = nfts.map((nft: any) => {
      // Extract metadata fields if they exist
      const metadata = nft.metadata || {};
      
      return {
        // Core fields
        id: nft.id || nft.nftId || nft.tokenId,
        tokenId: nft.tokenId || nft.id || nft.nftId,
        mint: nft.tokenAddress || nft.id,
        owner: nft.ownerWallet || walletAddressFromParams,
        collection: PROXIM8_COLLECTION,
        
        // Flatten metadata fields
        name: metadata.name || nft.name || `Proxim8 #${(nft.id || '').slice(-4)}`,
        description: metadata.description || nft.description || '',
        image: metadata.image || nft.image || '',
        attributes: metadata.attributes || nft.attributes || [],
        
        // Keep any extra fields
        ...nft,
        // Remove the nested metadata since we've flattened it
        metadata: undefined
      };
    });

    console.log(
      `[API Route] NFT: Transformed ${transformedNfts.length} NFTs for frontend`
    );
    
    // Log first transformed NFT for debugging
    if (transformedNfts.length > 0) {
      console.log(
        `[API Route] NFT: First transformed NFT:`,
        JSON.stringify(transformedNfts[0], null, 2)
      );
    }

    return NextResponse.json(transformedNfts);
  } catch (err) {
    console.error("[API Route] NFT: Error fetching NFTs:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch NFTs", details: errorMessage },
      { status: 500 }
    );
  }
}
