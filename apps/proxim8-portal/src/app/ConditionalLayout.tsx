"use client";

import { usePathname } from "next/navigation";
import { ClientLayout } from "./ClientLayout";
import { PortalLayout } from "./PortalLayout";

// Routes that should use the portal layout (no header, no scan lines)
const PORTAL_ROUTES = [
  "/",
  "/my-proxim8s",
  "/lore",
  "/claim-lore",
  "/missions",
];

// Pattern-based routes that should use portal layout
const PORTAL_ROUTE_PATTERNS = [/^\/agent\/[^/]+$/];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current route should use portal layout
  const usePortalLayout =
    PORTAL_ROUTES.includes(pathname) ||
    PORTAL_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));

  if (usePortalLayout) {
    return <PortalLayout>{children}</PortalLayout>;
  }

  return <ClientLayout>{children}</ClientLayout>;
}
