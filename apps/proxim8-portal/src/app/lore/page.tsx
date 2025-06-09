import { Metadata } from "next";
import LoreClient from "./LoreClient";

export const metadata: Metadata = {
  title: "Lore Archives | Project 89 Memory Fragments",
  description: "Access recovered memory fragments from your Proxim8 agents. Each piece reveals hidden truths about Oneirocom's dystopian plans and the resistance's fight for consciousness liberation.",
  keywords: "lore fragments, agent memories, resistance intelligence, consciousness technology, timeline war, Oneirocom secrets, Project 89 archives",
};

export default function LorePage() {
  return <LoreClient />;
}