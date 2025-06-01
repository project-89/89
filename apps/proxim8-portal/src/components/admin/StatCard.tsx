"use server";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
}

export default async function StatCard({
  title,
  value,
  icon,
  color,
}: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );
}
