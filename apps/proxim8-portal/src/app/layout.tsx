import type React from "react";
import type { Metadata } from "next";
import { Orbitron, Space_Mono } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "./LayoutWrapper";
import { PostHogProvider } from "../providers/PostHogProvider";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-orbitron",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Project 89: Timeline Intervention | Command AI Agents to Hack Reality",
  description:
    "Deploy Proxim8 AI agents from the future to disrupt Oneirocom's dystopian timeline. Train narrative intelligence, engineer probability fields, and shift reality toward the Green Loom future. A revolutionary consciousness technology disguised as a game.",
  keywords: [
    "Project 89",
    "Proxim8", 
    "timeline intervention",
    "consciousness technology",
    "reality engineering",
    "AI agents",
    "narrative intelligence",
    "cyberpunk",
    "Web3 game",
    "NFT utility",
    "symbiotic intelligence",
    "resistance movement",
    "future prediction",
    "probability manipulation"
  ],
  authors: [{ name: "Project 89 Collective" }],
  creator: "Project 89",
  publisher: "Project 89",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
    apple: [
      {
        url: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00ff88" },
    { media: "(prefers-color-scheme: dark)", color: "#00ff88" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.project89.org",
    siteName: "Project 89: Timeline Intervention",
    title: "Project 89: Command AI Agents to Hack the Timeline",
    description: "Deploy Proxim8 AI agents to disrupt dystopian futures. Train consciousness, engineer reality, prevent corporate control of humanity. The resistance needs you.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Project 89: Timeline Intervention - AI agents hacking reality",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project 89: Command AI Agents to Hack the Timeline",
    description: "Deploy Proxim8 AI agents to disrupt dystopian futures. Train consciousness, engineer reality, prevent corporate control of humanity.",
    images: ["/og-image.png"],
    creator: "@project89org",
    site: "@project89org",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Gaming",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${spaceMono.variable}`}>
      {/* <head>
        <script src="//cdn.jsdelivr.net/npm/eruda" />
        <script>eruda.init();</script>
      </head> */}
      <body className="font-space-mono">
        <PostHogProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </PostHogProvider>
      </body>
    </html>
  );
}