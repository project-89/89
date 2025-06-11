import { Metadata } from "next";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/config";
import NFTsClient from "./NFTsClient";
import { NFTMetadata } from "@/types/nft";

export const metadata: Metadata = {
  title: "NFTs | Proxim8",
  description:
    "Browse and manage your Proxim8 NFTs. Generate videos and claim lore for your collection.",
  keywords: "NFT, collection, Proxim8, video generation, lore",
};

// Revalidate every hour
export const revalidate = 3600;

// Server component to fetch user's NFTs if authenticated
async function getUserNFTs(): Promise<NFTMetadata[]> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;

  if (!authToken) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/nfts/user`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`Error fetching user NFTs: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user NFTs:", error);
    return [];
  }
}

export default async function NFTsPage() {
  // Fetch data on the server
  const userNFTs = await getUserNFTs();

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black text-white overflow-hidden relative">
      {/* Code matrix background */}
      <div className="absolute inset-0 opacity-10 z-0">
        <div
          className="absolute inset-0 bg-cyber-terminal"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><text x="50%" y="50%" font-family="monospace" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="%2300e639">01</text></svg>\')',
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Glitch overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-blue/10 via-accent-magenta/5 to-transparent"></div>
        <div className="absolute inset-0 animate-glitch bg-gradient-to-r from-accent-magenta/10 via-transparent to-accent-cyan/10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Proxim8 NFTs</h1>
        <NFTsClient initialUserNFTs={userNFTs} />
      </div>
    </div>
  );
}
