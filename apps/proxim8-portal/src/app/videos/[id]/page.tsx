import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import VideoDetailClient from "./VideoDetailClient";
import { Video } from "../../../types";
import { API_BASE_URL } from "@/config";

interface Props {
  params: {
    id: string;
  };
}

// Server component to fetch a video by ID
async function getVideoById(videoId: string): Promise<Video> {
  const cookieStore = cookies();
  const authToken = cookieStore.get("authToken")?.value;

  try {
    const response = await fetch(`${API_BASE_URL}/api/video/${videoId}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Error fetching video: ${response.status}`);
      throw new Error(`Failed to load video: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching video:", error);
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const video = await getVideoById(params.id);

    if (!video) {
      return {
        title: "Video Not Found",
        description: "The requested video could not be found.",
      };
    }

    return {
      title: `${video.title} | Proxim8 Video`,
      description: video.description || `Watch ${video.title} on Proxim8.`,
      openGraph: {
        title: `${video.title} | Proxim8 Video`,
        description: video.description || `Watch ${video.title} on Proxim8.`,
        images: video.thumbnail ? [video.thumbnail] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Video | Proxim8",
      description: "Watch NFT videos on Proxim8.",
    };
  }
}

export const revalidate = 300; // Revalidate every 5 minutes

export default async function VideoDetailPage({ params }: Props) {
  try {
    // Fetch video data using server component function
    const video = await getVideoById(params.id);
    console.log(`Loaded video "${video.title}"`);

    if (!video) {
      notFound();
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <VideoDetailClient video={video} initialError={null} />
      </div>
    );
  } catch (err) {
    console.error("Error loading video:", err);
    notFound();
  }
}
