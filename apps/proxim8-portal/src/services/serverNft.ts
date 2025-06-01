import { serverApi } from "./serverApi";
import { NFTMetadata, NFTAttribute } from "@/types/nft";
import { API_BASE_URL } from "@/config";
import { getServerNFTByMintImpl, ApiClient } from "./nftService";

// Create server API adapter that satisfies the ApiClient interface
const serverApiAdapter: ApiClient = {
  get: serverApi.get.bind(serverApi),
  post: serverApi.post.bind(serverApi),
  put: serverApi.put.bind(serverApi),
  del: serverApi.delete.bind(serverApi),
};

// API key for server-side requests
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "proxim8-dev-key";

/**
 * Get NFT by ID (server-side)
 * @param id NFT ID or mint address
 * @returns NFT metadata or null if not found
 */
export async function getServerNFT(id: string): Promise<NFTMetadata | null> {
  return getServerNFTByMintImpl(serverApiAdapter, id, API_KEY);
}

/**
 * Get NFTs by wallet (server-side)
 * @param walletAddress Wallet address
 * @returns Array of NFT metadata or empty array if none found
 */
export async function getServerNFTsByWallet(
  walletAddress: string
): Promise<NFTMetadata[]> {
  try {
    console.log(`[Server] Fetching NFTs for wallet: ${walletAddress}`);

    // Add query parameters for filtering
    const params = new URLSearchParams();
    params.append("filterByCollection", "true");

    const url = `${API_BASE_URL}/nft/${walletAddress}?${params.toString()}`;
    console.log(`[Server] Fetching from URL: ${url}`);

    // Direct fetch call with API key
    const config = {
      headers: {
        "Cache-Control": "no-cache",
        "X-API-Key": API_KEY,
      },
    };

    const data = await serverApi.get<NFTMetadata[]>(url, config);

    // Ensure each NFT has both id and mint fields set
    const processedData = data.map((nft) => {
      // If mint is missing but id is present, use id as mint
      if (!nft.mint && nft.id) {
        nft.mint = nft.id;
      }
      // If id is missing but mint is present, use mint as id
      if (!nft.id && nft.mint) {
        nft.id = nft.mint;
      }
      return nft;
    });

    console.log(
      `[Server] Successfully fetched ${processedData.length} NFTs for wallet: ${walletAddress}`
    );
    return processedData;
  } catch (error) {
    console.error(
      `[Server] Error fetching NFTs for wallet ${walletAddress}:`,
      error
    );
    return [];
  }
}
