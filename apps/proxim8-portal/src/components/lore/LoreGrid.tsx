"use client";

import { Lore } from "../../types";
import LoreCard from "./LoreCard";

interface LoreGridProps {
  lore: Lore[];
  loading?: boolean;
}

export default function LoreGrid({ lore, loading = false }: LoreGridProps) {
  if (lore.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lore.map((item) => (
        <LoreCard key={item.id} lore={item} />
      ))}

      {/* Loading skeleton placeholders */}
      {loading &&
        Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="bg-gray-800 rounded-lg p-6 animate-pulse h-64"
          >
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-4/6 mb-6"></div>
            <div className="h-24 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
    </div>
  );
}
