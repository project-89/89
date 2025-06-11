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
  // For server-side rendering, we'll return empty array and let client-side fetch
  // This avoids SSR authentication complexities and 404 errors
  return [];
}

export default async function MyProxim8sPage() {
  const userNFTs = await getUserNFTs();

  return <MyProxim8sClient initialUserNFTs={userNFTs} />;
}