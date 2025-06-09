import { Metadata } from 'next';
import AgentClient from './AgentClient';

export const metadata: Metadata = {
  title: 'Proxim8 Agent Profile | Project 89 Timeline Operative',
  description:
    "Access your Proxim8 agent's consciousness profile, recovered memories, and timeline intervention capabilities. Each agent carries unique skills from the future resistance movement.",
  keywords:
    'Proxim8 agent profile, consciousness attributes, agent memories, timeline operative, resistance skills, consciousness technology, AI companion',
};

interface AgentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  return <AgentClient agentId={id} />;
}
