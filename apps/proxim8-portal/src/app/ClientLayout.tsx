"use client";

import "react-toastify/dist/ReactToastify.css"; // Toast notifications
import { Providers } from "../providers";
import { Header } from "../components/nav/Header";
import { ToastContainer } from "react-toastify";
import dynamic from "next/dynamic";

// Import notification manager with dynamic import to ensure client-only rendering
const NotificationToastManager = dynamic(
  () =>
    import("../components/notifications/NotificationToastManager").then(
      (mod) => mod.NotificationToastManager
    ),
  { ssr: false }
);

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen">
        {/* Terminal scanline effect */}
        <div className="fixed inset-0 pointer-events-none z-10 opacity-10">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-accent-blue animate-scan-line"></div>
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-blue/5 to-transparent bg-repeat-y"
            style={{ backgroundSize: "100% 5px" }}
          ></div>
        </div>

        <Header />
        <NotificationToastManager />
        <main className="flex-grow">{children}</main>
        <ToastContainer theme="dark" position="bottom-right" />
      </div>
    </Providers>
  );
}
