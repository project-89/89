"use client";

import "react-toastify/dist/ReactToastify.css";
import { Providers } from "../providers";
import { ToastContainer } from "react-toastify";
import { PortalHeader } from "../components/nav/PortalHeader";
import { useAnalytics } from "../hooks/useAnalytics";
import { useEffect } from "react";
import dynamic from "next/dynamic";

const NotificationToastManager = dynamic(
  () =>
    import("../components/notifications/NotificationToastManager").then(
      (mod) => mod.NotificationToastManager
    ),
  { ssr: false }
);

export function PortalLayout({ children }: { children: React.ReactNode }) {
  // Initialize analytics tracking
  useAnalytics();
  
  // Track app load
  useEffect(() => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (loadTime > 0) {
      // Track only when load time is available
      // Use our analytics utility instead of direct window.posthog
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('app_loaded', {
          load_time_ms: loadTime,
          load_time_seconds: Math.round(loadTime / 1000)
        });
      }
    }
  }, []);

  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        <PortalHeader />
        <NotificationToastManager />
        {children}
        <ToastContainer theme="dark" position="bottom-right" />
      </div>
    </Providers>
  );
}