import { API_BASE_URL } from '@/config';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Video } from '../../../types';
import VideoDetailClient from './VideoDetailClient';

interface VideoPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getVideoById(id: string): Promise<Video | null> {
  const apiUrl = `${API_BASE_URL}/videos/${id}`;
  console.log(`Fetching video from: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch video: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching video:', error);
    throw error;
  }
}

export async function generateMetadata({
  params,
}: VideoPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const video = await getVideoById(id);

    if (!video) {
      return {
        title: 'Video Not Found | Pipeline',
      };
    }

    return {
      title: `${video.title} | Pipeline`,
      description: video.description || 'Watch this video on Pipeline',
    };
  } catch (error) {
    return {
      title: 'Video | Pipeline',
    };
  }
}

export const revalidate = 300; // Revalidate every 5 minutes

export default async function VideoDetailPage({ params }: VideoPageProps) {
  try {
    const { id } = await params;
    // Fetch video data using server component function
    const video = await getVideoById(id);

    if (!video) {
      notFound();
    }

    console.log(`Loaded video "${video.title}"`);

    return (
      <div className="container mx-auto px-4 py-8">
        <VideoDetailClient video={video} initialError={null} />
      </div>
    );
  } catch (err) {
    console.error('Error loading video:', err);
    notFound();
  }
}
