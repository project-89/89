"use client";

import { useState, useCallback } from "react";
import { debounce } from "lodash";
import { SEARCH_DEBOUNCE_DELAY } from "@/config";
import { BiSearch } from "react-icons/bi";

interface LoreSearchProps {
  onSearch: (query: string) => void;
}

export default function LoreSearch({ onSearch }: LoreSearchProps) {
  const [searchInput, setSearchInput] = useState("");

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, SEARCH_DEBOUNCE_DELAY),
    [onSearch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center mb-6">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <BiSearch className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="search"
          value={searchInput}
          onChange={handleSearchChange}
          className="w-full p-4 pl-10 text-sm border rounded-lg bg-gray-800 border-gray-700 placeholder-gray-400 text-white focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Search lore by title or content..."
        />
        <button
          type="submit"
          className="absolute right-2.5 bottom-2.5 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium rounded-lg text-sm px-4 py-2 text-white"
        >
          Search
        </button>
      </div>
    </form>
  );
}
