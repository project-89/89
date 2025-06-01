"use client";

import "react-toastify/dist/ReactToastify.css";
import { Providers } from "../providers";
import { ToastContainer } from "react-toastify";
import { PortalHeader } from "../components/nav/PortalHeader";
import dynamic from "next/dynamic";

const NotificationToastManager = dynamic(
  () =>
    import("../components/notifications/NotificationToastManager").then(
      (mod) => mod.NotificationToastManager
    ),
  { ssr: false }
);

export function PortalLayout({ children }: { children: React.ReactNode }) {
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