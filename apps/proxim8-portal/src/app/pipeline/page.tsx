import { Metadata } from "next";
import { Suspense } from "react";
import PipelineClient from "./PipelineClient";

export const metadata: Metadata = {
  title: "Agent Media Pipeline | Project 89 Content Generation",
  description: "Generate unique videos and media content featuring your Proxim8 agents. Visualize their timeline interventions and document their missions against Oneirocom's dystopian future.",
  keywords: "Proxim8 videos, agent content generation, timeline documentation, AI video creation, mission reports, consciousness technology",
};

// Force dynamic rendering since this page uses search params
export const dynamic = "force-dynamic";

// Set revalidation time to 1 hour
export const revalidate = 3600;

export default function PipelinePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-indigo-300">Loading pipeline...</span>
        </div>
      }
    >
      <PipelineClient />
    </Suspense>
  );
}
