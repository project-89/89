'use client';

import { useMissions, useCreateMission } from '@/hooks/useZenStack';
import { useState } from 'react';

export function MissionListExample() {
  const { data: missions, isLoading, error } = useMissions({
    include: JSON.stringify({ objectives: true }),
    orderBy: JSON.stringify({ createdAt: 'desc' }),
  });

  const createMission = useCreateMission();
  const [newMissionTitle, setNewMissionTitle] = useState('');

  if (isLoading) return <div>Loading missions...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleCreateMission = async () => {
    if (!newMissionTitle) return;

    try {
      await createMission.mutateAsync({
        title: newMissionTitle,
        description: 'Created via ZenStack',
        status: 'draft',
        type: 'reconnaissance',
        difficulty: 'medium',
        requirements: [],
        rewards: { xp: 100, credits: 50 },
      });
      setNewMissionTitle('');
    } catch (error) {
      console.error('Failed to create mission:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Missions (ZenStack Example)</h2>
      
      {/* Create Mission Form */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newMissionTitle}
          onChange={(e) => setNewMissionTitle(e.target.value)}
          placeholder="New mission title"
          className="px-3 py-2 border rounded"
        />
        <button
          onClick={handleCreateMission}
          disabled={createMission.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {createMission.isPending ? 'Creating...' : 'Create Mission'}
        </button>
      </div>

      {/* Mission List */}
      <div className="space-y-4">
        {missions?.map((mission) => (
          <div key={mission.id} className="border p-4 rounded">
            <h3 className="font-semibold">{mission.title}</h3>
            <p className="text-gray-600">{mission.description}</p>
            <div className="mt-2 flex gap-2 text-sm">
              <span className="px-2 py-1 bg-gray-100 rounded">
                {mission.status}
              </span>
              <span className="px-2 py-1 bg-blue-100 rounded">
                {mission.type}
              </span>
              <span className="px-2 py-1 bg-green-100 rounded">
                {mission.difficulty}
              </span>
            </div>
            {mission.objectives && mission.objectives.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Objectives:</p>
                <ul className="text-sm text-gray-600 ml-4 list-disc">
                  {mission.objectives.map((obj, idx) => (
                    <li key={idx}>{obj.description}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}