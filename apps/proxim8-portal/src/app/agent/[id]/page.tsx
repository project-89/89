import { Metadata } from "next";
import AgentClient from "./AgentClient";

export const metadata: Metadata = {
  title: "Agent Details | Project 89",
  description: "Access your Proxim8 agent's memories and capabilities",
};

interface AgentPageProps {
  params: {
    id: string;
  };
}

export default function AgentPage({ params }: AgentPageProps) {
  return <AgentClient agentId={params.id} />;
}