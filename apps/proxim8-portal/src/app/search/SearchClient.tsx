"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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

interface Props {
  initialResults: SearchResult[];
  query: string;
}

type FilterTab = "all" | "nft" | "video" | "lore";

export default function SearchClient({
  initialResults,
  query: initialQuery,
}: Props) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || initialQuery || "";
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [loading, setLoading] = useState(
    initialResults.length === 0 && query !== ""
  );
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    // If the query changes or doesn't match what was used for initialResults,
    // fetch new results from the client
    const fetchSearchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      // If we already have results for this query from the server, don't fetch again
      if (initialResults.length > 0 && query === initialQuery) {
        setResults(initialResults);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch search results");
        }

        const data = await response.json();
        setResults(data.results || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError("Failed to load search results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, initialResults, initialQuery]);

  // Filter results based on active tab
  const filteredResults =
    activeTab === "all"
      ? results
      : results.filter((result) => result.type === activeTab);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          Search Results for &quot;{query}&quot;
        </h1>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">
        Search Results for &quot;{query}&quot;
      </h1>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* If no search query */}
      {!query && (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <p className="text-xl text-gray-300 mb-2">No search query provided</p>
          <p className="text-gray-400">
            Please enter a search term to find NFTs, videos, and lore
          </p>
        </div>
      )}

      {/* Results tabs */}
      {query && (
        <div className="mb-8">
          <div className="flex overflow-x-auto pb-2 border-b border-gray-700">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "all"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              All Results ({results.length})
            </button>
            <button
              onClick={() => setActiveTab("nft")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "nft"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              NFTs ({results.filter((r) => r.type === "nft").length})
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "video"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Videos ({results.filter((r) => r.type === "video").length})
            </button>
            <button
              onClick={() => setActiveTab("lore")}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === "lore"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Lore ({results.filter((r) => r.type === "lore").length})
            </button>
          </div>

          {/* Results */}
          {filteredResults.length > 0 ? (
            <div className="space-y-6">
              {filteredResults.map((result) => (
                <Link
                  href={result.url}
                  key={`${result.type}-${result.id}`}
                  className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 relative flex-shrink-0">
                      <Image
                        src={result.image}
                        alt={result.title}
                        fill
                        className="object-cover rounded-md"
                        sizes="96px"
                      />
                      <div className="absolute top-0 left-0 bg-gray-900/80 text-xs px-2 py-1 rounded-tl-md rounded-br-md">
                        {result.type === "nft" && "NFT"}
                        {result.type === "video" && "Video"}
                        {result.type === "lore" && "Lore"}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-medium text-lg mb-1">
                        {result.title}
                      </h2>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                        {result.description}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        {result.creator && <span>By: {result.creator}</span>}
                        <span>
                          Created:{" "}
                          {new Date(result.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <p className="text-xl text-gray-300 mb-2">No results found</p>
              <p className="text-gray-400">
                Try a different search term or category
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
