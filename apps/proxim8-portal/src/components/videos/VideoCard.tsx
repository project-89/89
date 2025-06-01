import React from "react";
import { Video } from "@/types";
import VideoCardInteractive from "./VideoCardInteractive";

interface VideoCardProps {
  video: Video;
  showPublicBadge?: boolean;
  enhanced?: boolean;
}

// Main VideoCard component as a server component
export default function VideoCard({
  video,
  showPublicBadge = true,
  enhanced = false,
}: VideoCardProps) {
  return (
    <VideoCardInteractive
      video={video}
      showPublicBadge={showPublicBadge}
      enhanced={enhanced}
    />
  );
}
