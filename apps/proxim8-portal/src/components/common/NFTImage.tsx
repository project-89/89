import Image from "next/image";
import { useState, useEffect } from "react";

interface NFTImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait" | "auto";
  objectFit?: "cover" | "contain";
  onClick?: () => void;
}

// Define aspect ratio styles
const aspectRatioStyles = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  auto: "",
};

export default function NFTImage({
  src,
  alt,
  width = 500,
  height = 500,
  priority = false,
  className = "",
  aspectRatio = "square",
  objectFit = "cover",
  onClick,
}: NFTImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Reset state when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setIsLoading(true);
      setHasError(false);
      setRetryCount(0);
    }
  }, [src, currentSrc]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    // Retry loading up to 3 times with a delay
    if (retryCount < 3 && src) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Force reload by adding a timestamp query parameter
        setCurrentSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${Date.now()}`);
      }, 1000 * (retryCount + 1)); // Exponential backoff
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${aspectRatioStyles[aspectRatio]} ${className}`}
      onClick={onClick}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}

      {/* Error state */}
      {hasError ? (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Image unavailable</p>
        </div>
      ) : (
        <Image
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          quality={90}
          className={`transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          } ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
          style={{
            width: "100%",
            height: aspectRatio === "auto" ? "auto" : "100%",
          }}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
