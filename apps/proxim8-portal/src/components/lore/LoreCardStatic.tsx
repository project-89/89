import React from "react";
import { Lore } from "@/types/lore";
// import Link from "next/link";

interface LoreCardStaticProps {
  initialLore: Lore[] | null;
}

export default function LoreCardStatic({ initialLore }: LoreCardStaticProps) {
  const lore = initialLore;

  if (!lore) {
    return (
      <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg">
        <p className="text-gray-400 italic">No lore has been claimed yet.</p>
      </div>
    );
  }

  return (
    <>
      {lore.map((lore) => (
        <div
          className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg"
          key={lore.id}
        >
          <h3 className="text-xl font-semibold text-white mb-3">
            {lore.title}
          </h3>
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-300">
              {lore.content}
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Last updated: {new Date(lore.updatedAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </>
  );
}
