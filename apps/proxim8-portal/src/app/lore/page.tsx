import { Metadata } from "next";
import LoreClient from "./LoreClient";

export const metadata: Metadata = {
  title: "Lore Archives | Project 89",
  description: "Recovered memory fragments from your Proxim8 agents. Discover the truth about the war between timelines.",
  keywords: "lore, memories, Proxim8, timeline, Project 89",
};

export default function LorePage() {
  return <LoreClient />;
}