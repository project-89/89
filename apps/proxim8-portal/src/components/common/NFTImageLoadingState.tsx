"use client";

import { useState } from "react";

interface NFTImageLoadingStateProps {
  onLoadingComplete: () => void;
  onError: () => void;
}

export default function NFTImageLoadingState({
  onLoadingComplete,
  onError,
}: NFTImageLoadingStateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // const handleLoadingComplete = () => {
  //   setIsLoading(false);
  //   onLoadingComplete();
  // };

  // const handleError = () => {
  //   setError(true);
  //   setIsLoading(false);
  //   onError();
  // };

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
          <svg
            className="w-10 h-10 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-400">
          <svg
            className="w-12 h-12 mb-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm">Failed to load image</p>
        </div>
      )}
    </>
  );
}
