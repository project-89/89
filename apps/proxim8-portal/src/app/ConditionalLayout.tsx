"use client";

import { PortalLayout } from "./PortalLayout";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  // Always use PortalLayout now that we've removed the old layout system
  return <PortalLayout>{children}</PortalLayout>;
}
