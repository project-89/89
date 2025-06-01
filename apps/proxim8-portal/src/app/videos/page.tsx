import { Metadata } from "next";
import { cookies } from "next/headers";
import { Video } from "../../types";
import VideosClient from "./VideosClient";
import { API_BASE_URL } from "@/config";

export const metadata: Metadata = {
  title: "Proxim8 - Videos",
  description:
    "Explore AI-generated videos created from NFTs in the Proxim8 collection",
};

// Revalidate every 5 minutes
export const revalidate = 300;

// Server component to fetch public videos
async function getPublicVideos(): Promise<Video[]> {
  try {
    console.log("Fetching initial public videos from server component...");
    const response = await fetch(`${API_BASE_URL}/api/public/videos?limit=12`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Error fetching public videos: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching public videos:", error);
    return [];
  }
}

// Server component to fetch user's videos if authenticated
async function getUserVideos(): Promise<{ videos: Video[]; total: number }> {
  const cookieStore = cookies();
  const authToken = cookieStore.get("authToken")?.value;

  if (!authToken) {
    return { videos: [], total: 0 };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/video/user?limit=12`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`Error fetching user videos: ${response.status}`);
      return { videos: [], total: 0 };
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user videos:", error);
    return { videos: [], total: 0 };
  }
}

export default async function VideosPage() {
  // Fetch data on the server
  const [publicVideos, userVideos] = await Promise.all([
    getPublicVideos(),
    getUserVideos(),
  ]);

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
        <h1 className="text-3xl font-bold text-white mb-8">Videos</h1>
        <VideosClient
          initialVideos={publicVideos}
          initialError={null}
          initialUserVideos={userVideos}
        />
      </div>
    </div>
  );
}
