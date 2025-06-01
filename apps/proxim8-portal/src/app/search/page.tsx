import { Metadata } from "next";
import { cookies } from "next/headers";
import SearchClient from "./SearchClient";
import { API_BASE_URL } from "@/config";

export const metadata: Metadata = {
  title: "Search | Proxim8",
  description: "Search for NFTs, videos, and lore in the Proxim8 ecosystem.",
  keywords: "search, NFT, video, lore, Proxim8",
};

// Revalidate every hour
export const revalidate = 3600;

interface SearchResult {
  id: string;
  type: "nft" | "video" | "lore";
  title: string;
  description: string;
  image: string;
  createdAt: string;
  creator?: string;
  url: string;
}

interface SearchResults {
  results: SearchResult[];
}

// Server component to fetch search results
async function getSearchResults(query: string): Promise<SearchResult[]> {
  if (!query) {
    return [];
  }

  const cookieStore = cookies();
  const authToken = cookieStore.get("authToken")?.value;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`,
      {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        next: { revalidate: 60 }, // Cache for 1 minute
      }
    );

    if (!response.ok) {
      console.error(`Error fetching search results: ${response.status}`);
      return [];
    }

    const data: SearchResults = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";

  // Fetch initial search results on the server
  const initialResults = await getSearchResults(query);

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
        <SearchClient initialResults={initialResults} query={query} />
      </div>
    </div>
  );
}
