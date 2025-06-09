import { Metadata } from 'next';
import { Suspense } from 'react';
import MissionDashboardClient from './MissionDashboardClient';

export const metadata: Metadata = {
  title: 'Mission Dashboard - Project 89',
  description: 'Execute timeline manipulation operations as a Project 89 agent',
};

interface Props {
  params: Promise<{
    missionId: string;
  }>;
}

export default async function MissionDashboardPage({ params }: Props) {
  const { missionId } = await params;
  return (
    <Suspense fallback={<MissionLoading />}>
      <MissionDashboardClient missionId={missionId} />
    </Suspense>
  );
}

function MissionLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400 mx-auto mb-4"></div>
        <p className="text-green-400">Loading mission data...</p>
      </div>
    </div>
  );
}
