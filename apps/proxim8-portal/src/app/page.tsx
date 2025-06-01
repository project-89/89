import { Metadata } from "next";
import HomeClient from "./HomeClient";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/config";
import PortalPage from "./PortalPage";

export const metadata: Metadata = {
  title: "Proxim8 - AI-Powered NFT Video Generation",
  description:
    "Transform your NFTs into dynamic videos using advanced AI technology. Create, share, and explore unique NFT animations.",
  keywords: "NFT, video generation, AI, animation, blockchain, Solana",
};

// Revalidate every hour
export const revalidate = 3600;

// Fetch featured data for the homepage
async function getFeaturedContent() {
  try {
    // Attempt to fetch featured videos
    const response = await fetch(`${API_BASE_URL}/videos/featured`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Error fetching featured content: ${response.status}`);
      return { videos: [], nfts: [] };
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching featured content:", error);
    return { videos: [], nfts: [] };
  }
}

// Check if user is authenticated
async function isAuthenticated() {
  const cookieStore = cookies();
  const authToken = cookieStore.get("authToken")?.value;

  return !!authToken;
}

export default async function HomePage() {
  // Fetch data in parallel
  const [featured, authenticated] = await Promise.all([
    getFeaturedContent(),
    isAuthenticated(),
  ]);

  return (
    <PortalPage />
    // <HomeClient
    //   initialFeaturedContent={featured}
    //   isServerAuthenticated={authenticated}
    // />
  );
}
