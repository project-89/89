"use client";

import { ConditionalLayout } from "./ConditionalLayout";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return <ConditionalLayout>{children}</ConditionalLayout>;
}