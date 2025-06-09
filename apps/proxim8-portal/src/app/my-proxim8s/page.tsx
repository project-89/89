import { Metadata } from "next";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/config";
import MyProxim8sClient from "./MyProxim8sClient";
import { NFTMetadata } from "@/types/nft";

export const metadata: Metadata = {
  title: "My Proxim8 Agents | Project 89 Timeline Intervention",
  description: "Command your Proxim8 AI agents from 2089. Each consciousness carries unique memories and abilities to disrupt Oneirocom's dystopian timeline. Deploy them on reality-altering missions to save the future.",
  keywords: "Proxim8 agents, AI consciousness, timeline missions, resistance operatives, consciousness technology, future memories, reality hacking, Project 89",
};

export const revalidate = 3600;

async function getUserNFTs(): Promise<NFTMetadata[]> {
  const cookieStore = cookies();
  const authToken = cookieStore.get("authToken")?.value;

  if (!authToken) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/nfts/user`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      next: { revalidate: 60 },
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

export default async function MyProxim8sPage() {
  const userNFTs = await getUserNFTs();

  return <MyProxim8sClient initialUserNFTs={userNFTs} />;
}