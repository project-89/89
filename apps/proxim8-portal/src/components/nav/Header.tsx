import React from "react";
import dynamic from "next/dynamic";
import HeaderStatic from "./HeaderStatic";

// Dynamically import the interactive parts with client-side only rendering
const HeaderInteractive = dynamic(() => import("./HeaderInteractive"), {
  ssr: false,
});

export const Header: React.FC = () => {
  return (
    <header className="bg-cyber-terminal border-b border-primary-500/30 relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <HeaderStatic />
          <HeaderInteractive isActive={() => false} />
        </div>
      </div>
    </header>
  );
};
