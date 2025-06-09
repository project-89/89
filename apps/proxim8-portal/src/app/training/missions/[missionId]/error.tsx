"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function MissionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Mission loading error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-red-500/20 rounded-full blur-xl animate-pulse" />
          </div>
          <AlertTriangle className="w-24 h-24 text-red-500 mx-auto relative" />
        </div>
        
        <div className="space-y-2">
          <h2 className="font-orbitron text-2xl font-bold text-white">
            MISSION ACCESS DENIED
          </h2>
          <p className="font-space-mono text-sm text-gray-400">
            Timeline interference detected. Unable to establish connection.
          </p>
        </div>

        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="font-space-mono text-xs text-red-400">
            ERROR: {error.message || "Unknown quantum anomaly encountered"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-white text-black font-orbitron font-bold rounded hover:bg-gray-200 transition-colors"
          >
            RETRY CONNECTION
          </button>
          <Link
            href="/training"
            className="px-6 py-3 bg-gray-800 border border-gray-700 text-white font-orbitron font-bold rounded hover:bg-gray-700 transition-colors"
          >
            RETURN TO BASE
          </Link>
        </div>
      </div>
    </div>
  );
}