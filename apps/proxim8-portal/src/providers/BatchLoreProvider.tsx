"use client";

import React, { ReactNode } from "react";
import { BatchLoreContext, useBatchLoreProvider } from "@/hooks/useBatchLoreStatus";

interface BatchLoreProviderProps {
  children: ReactNode;
}

export default function BatchLoreProvider({ children }: BatchLoreProviderProps) {
  const batchLoreValue = useBatchLoreProvider();

  return (
    <BatchLoreContext.Provider value={batchLoreValue}>
      {children}
    </BatchLoreContext.Provider>
  );
}