import type React from "react";

export default function MyProxim8sLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout doesn't add any wrapping - it uses the root layout directly
  // which will apply the PortalLayout for this route
  return <>{children}</>;
}