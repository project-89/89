import { API_BASE_URL } from '@/config';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import PortalPage from './PortalPage';

export const metadata: Metadata = {
  title: 'Project 89: Timeline Portal | Deploy AI Agents Against Dystopia',
  description:
    "Welcome to the resistance. Deploy your Proxim8 AI agents to disrupt Oneirocom's dystopian timeline and shift reality toward the Green Loom future. In 2089, consciousness is enslaved—unless we change the timeline now.",
  keywords:
    'Project 89, Proxim8 agents, timeline intervention, consciousness technology, resistance portal, AI companions, reality hacking, dystopian prevention, Web3 resistance',
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
      console.log(response);
      console.error(`Error fetching featured content: ${response.status}`);
      return { videos: [], nfts: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching featured content:', error);
    return { videos: [], nfts: [] };
  }
}

// Check if user is authenticated
async function isAuthenticated() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;

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
