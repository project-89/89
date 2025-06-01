"use client";

import { useRouter } from "next/navigation";

export default function MissionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-gray-200 relative overflow-hidden flex items-center justify-center pt-24">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('/background-${Math.floor(Math.random() * 19) + 1}.png')`,
        }}
      />
      
      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        <h1 className="font-orbitron text-4xl font-bold text-amber-500 mb-4">
          TIMELINE MISSIONS
        </h1>
        <p className="font-space-mono text-lg text-gray-400 mb-8">
          COMING SOON
        </p>
        <p className="font-space-mono text-sm text-gray-500 max-w-md mx-auto">
          Deploy your Proxim8 agents to critical junctions in the timeline. 
          Change key events. Secure the Green Loom future.
        </p>
      </div>
    </div>
  );
}