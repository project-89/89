"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWalletAuth } from "@/stores/walletAuthStore";
import dynamic from "next/dynamic";

// Types
interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  createdAt: string;
}

interface NFT {
  id: string;
  name: string;
  imageUrl: string;
}

interface FeaturedContent {
  videos: Video[];
  nfts: NFT[];
}

interface HomeClientProps {
  initialFeaturedContent?: FeaturedContent;
  isServerAuthenticated?: boolean;
}

// Import wallet-related components dynamically to prevent SSR issues
const UnifiedWalletButton = dynamic(
  () =>
    import("@/components/wallet/UnifiedWalletButton").then((mod) => ({
      default: mod.UnifiedWalletButton,
    })),
  { ssr: false }
);

export default function HomeClient({
  initialFeaturedContent = { videos: [], nfts: [] },
}: HomeClientProps) {
  // Use the new unified wallet auth hook
  const {
    connected,
    isAuthenticated,
    error: walletAuthError,
  } = useWalletAuth();

  // Basic state
  const [terminalText, setTerminalText] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const fullText =
    "[REALITY STATUS: COMPROMISED]\n> INITIALIZING PROXIM8 CONNECTION...\n> REALITY ENGINE v8.9 ONLINE\n> SEEKING AGENTS...";

  // Handle authentication error from the hook
  useEffect(() => {
    if (walletAuthError) {
      setWalletError(walletAuthError);
    }
  }, [walletAuthError]);

  // Terminal typing effect
  useEffect(() => {
    let currentText = "";
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        currentText += fullText[currentIndex];
        setTerminalText(currentText);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    return () => clearInterval(typingInterval);
  }, []);

  // Handle client-side mounting
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center bg-cyber-black text-white overflow-hidden relative">
      {/* Code matrix background */}
      <div className="absolute inset-0 opacity-10 z-0">
        <div
          className="absolute inset-0 bg-cyber-terminal"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><text x="50%" y="50%" font-family="monospace" font-size="10" text-anchor="middle" dominant-baseline="middle" fill="%2300e639">01</text></svg>\')',
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      {/* Glitch overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-blue/10 via-accent-magenta/5 to-transparent"></div>
        <div className="absolute inset-0 animate-glitch bg-gradient-to-r from-accent-magenta/10 via-transparent to-accent-cyan/10"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Mobile: Title first, Desktop: Side by side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Page Title and Description - appears first on mobile, right side on desktop */}
          <div className="order-1 lg:order-2">
            <div className="mb-6">
              <h1 className="text-5xl md:text-6xl font-cyber text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 uppercase font-bold tracking-wider mb-2">
                PROXIM8
              </h1>
              <div className="inline-block border-b border-primary-500 px-4 py-1 shadow-neon-strong mb-4">
                <h2 className="font-terminal text-lg text-primary-500 uppercase">
                  Reality Engineering Interface
                </h2>
              </div>
              <p className="text-gray-300 mb-8 font-body">
                Access point for resistance agents to invoke and transform your
                Proxim8 NFTs into
                <span className="text-accent-blue">
                  {" "}
                  reality-hacking videos
                </span>{" "}
                using advanced
                <span className="text-accent-magenta"> AI technology</span>.
              </p>
            </div>

            {/* Navigation buttons - show when wallet is connected and authenticated */}
            {connected && isAuthenticated && (
              <div className="mb-8">
                {/* Mobile: Full width buttons stacked */}
                <div className="md:hidden space-y-4">
                  <Link
                    href="/nfts"
                    className="block w-full bg-primary-500 hover:bg-primary-600 text-black font-terminal px-6 py-3 border border-primary-300 shadow-neon transition-all duration-200 text-center"
                  >
                    ACCESS YOUR NFTs
                  </Link>
                  <Link
                    href="/lore"
                    className="block w-full bg-cyber-midgray hover:bg-cyber-gray text-primary-500 font-terminal px-6 py-3 border border-primary-500 shadow-neon-subtle hover:shadow-neon transition-all duration-200 text-center"
                  >
                    CLAIM YOUR LORE
                  </Link>
                </div>

                {/* Desktop: Side by side buttons */}
                <div className="hidden md:block space-x-4">
                  <Link
                    href="/nfts"
                    className="inline-block bg-primary-500 hover:bg-primary-600 text-black font-terminal px-6 py-3 border border-primary-300 shadow-neon transition-all duration-200"
                  >
                    ACCESS YOUR NFTs
                  </Link>
                  <Link
                    href="/lore"
                    className="inline-block bg-cyber-midgray hover:bg-cyber-gray text-primary-500 font-terminal px-6 py-3 border border-primary-500 shadow-neon-subtle hover:shadow-neon transition-all duration-200"
                  >
                    CLAIM YOUR LORE
                  </Link>
                </div>
              </div>
            )}

            {/* Instruction Cards - show on medium and desktop screens in this section */}
            <div className="hidden md:block mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <div className="bg-cyber-midgray border border-accent-blue/30 p-4 hover:border-accent-blue hover:shadow-neon-blue transition-all duration-300">
                  <div className="font-terminal text-accent-blue mb-2">
                    [01] INVOKE
                  </div>
                  <p className="text-sm">
                    Generate consciousness-altering video transmissions from
                    your NFTs.
                  </p>
                </div>
                <div className="bg-cyber-midgray border border-primary-500/30 p-4 hover:border-primary-500 hover:shadow-neon transition-all duration-300">
                  <div className="font-terminal text-primary-500 mb-2">
                    [02] TRANSMIT
                  </div>
                  <p className="text-sm">
                    Broadcast your reality edits through secure channels to
                    other agents.
                  </p>
                </div>
                <div className="bg-cyber-midgray border border-accent-magenta/30 p-4 hover:border-accent-magenta hover:shadow-neon-magenta transition-all duration-300">
                  <div className="font-terminal text-accent-magenta mb-2">
                    [03] REWRITE
                  </div>
                  <p className="text-sm">
                    Manipulate timeline frequencies through custom video
                    pipelines.
                  </p>
                </div>
                <div className="bg-cyber-midgray border border-accent-cyan/30 p-4 hover:border-accent-cyan hover:shadow-neon-blue transition-all duration-300">
                  <div className="font-terminal text-accent-cyan mb-2">
                    [04] RECRUIT
                  </div>
                  <p className="text-sm">
                    Expand the resistance network with custom agent
                    initializations.
                  </p>
                </div>
              </div>
            </div>

            {/* Featured content - only show on desktop in this section */}
            {initialFeaturedContent.videos.length > 0 && (
              <div className="hidden lg:block mt-8 mb-8">
                <div className="border-b border-primary-500 mb-4">
                  <h3 className="font-terminal text-primary-500 text-lg pb-2">
                    FEATURED TRANSMISSIONS
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {initialFeaturedContent.videos.slice(0, 3).map((video) => (
                    <Link
                      href={`/videos/${video.id}`}
                      key={video.id}
                      className="bg-cyber-terminal border border-accent-blue/30 hover:border-accent-blue transition-all duration-300"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        {video.thumbnailUrl && (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title || "Video thumbnail"}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="font-terminal text-xs text-accent-blue truncate">
                          {video.title || "Untitled Video"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="hidden lg:block font-terminal text-xs text-gray-500 border-t border-gray-800 pt-4">
              <p className="mb-1">
                AUTHORIZED ACCESS ONLY • ONEIROCOM MONITORING ACTIVE
              </p>
              <p>
                REALITY STATUS:{" "}
                <span className="text-primary-500">AWAITING AGENT INPUT</span>
              </p>
            </div>
          </div>

          {/* Terminal Section - appears second on mobile, left side on desktop */}
          <div className="order-2 lg:order-1">
            <div className="bg-cyber-terminal border border-primary-500 shadow-neon p-6 rounded-none flex flex-col h-48">
              <div className="flex items-center mb-4 border-b border-primary-500 pb-2 flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-accent-magenta mr-2"></div>
                <div className="w-3 h-3 rounded-full bg-accent-blue mr-2"></div>
                <div className="w-3 h-3 rounded-full bg-primary-500 mr-2"></div>
                <div className="font-terminal text-primary-500 text-xs ml-2">
                  PROXIM8_REALITY_TERMINAL
                </div>
              </div>
              <div className="font-terminal text-primary-400 whitespace-pre-line overflow-y-auto flex-grow">
                {terminalText}
                <span className="inline-block w-2 h-4 bg-primary-500 ml-1 animate-terminal-cursor"></span>
              </div>

              {/* Show wallet error if present */}
              {walletError && (
                <div className="mt-4 bg-red-900/50 border border-red-500 p-3 text-red-300 font-terminal text-sm flex-shrink-0">
                  [ERROR]: {walletError}
                </div>
              )}
            </div>

            <div className="mt-8 font-terminal">
              <div className="text-accent-cyan mb-4 text-sm">
                {connected ? (
                  <>
                    <span className="text-primary-500">[WALLET_CONNECTED]</span>{" "}
                    {isAuthenticated
                      ? "READY TO INVOKE"
                      : "AUTHENTICATION REQUIRED"}
                  </>
                ) : (
                  <>
                    <span className="text-primary-500">
                      [CONNECTION_REQUIRED]
                    </span>{" "}
                    CONNECT WALLET TO INVOKE
                  </>
                )}
              </div>
              {isLoaded && (
                <div className="wallet-button-container space-y-3">
                  <UnifiedWalletButton />
                  <a
                    href="https://launchmynft.io/sol/16033"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wallet-adapter-button wallet-adapter-button-trigger bg-transparent border-2 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-all duration-200 block"
                  >
                    Buy Proxim8 NFT
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instruction Cards - show on mobile only, appears third on mobile */}
        <div className="md:hidden mt-12">
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="bg-cyber-midgray border border-accent-blue/30 p-4 hover:border-accent-blue hover:shadow-neon-blue transition-all duration-300">
              <div className="font-terminal text-accent-blue mb-2">
                [01] INVOKE
              </div>
              <p className="text-sm">
                Generate consciousness-altering video transmissions from your
                NFTs.
              </p>
            </div>
            <div className="bg-cyber-midgray border border-primary-500/30 p-4 hover:border-primary-500 hover:shadow-neon transition-all duration-300">
              <div className="font-terminal text-primary-500 mb-2">
                [02] TRANSMIT
              </div>
              <p className="text-sm">
                Broadcast your reality edits through secure channels to other
                agents.
              </p>
            </div>
            <div className="bg-cyber-midgray border border-accent-magenta/30 p-4 hover:border-accent-magenta hover:shadow-neon-magenta transition-all duration-300">
              <div className="font-terminal text-accent-magenta mb-2">
                [03] REWRITE
              </div>
              <p className="text-sm">
                Manipulate timeline frequencies through custom video pipelines.
              </p>
            </div>
            <div className="bg-cyber-midgray border border-accent-cyan/30 p-4 hover:border-accent-cyan hover:shadow-neon-blue transition-all duration-300">
              <div className="font-terminal text-accent-cyan mb-2">
                [04] RECRUIT
              </div>
              <p className="text-sm">
                Expand the resistance network with custom agent initializations.
              </p>
            </div>
          </div>
        </div>

        {/* Featured content - show on mobile below instruction cards */}
        {initialFeaturedContent.videos.length > 0 && (
          <div className="lg:hidden mt-8 mb-8">
            <div className="border-b border-primary-500 mb-4">
              <h3 className="font-terminal text-primary-500 text-lg pb-2">
                FEATURED TRANSMISSIONS
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {initialFeaturedContent.videos.slice(0, 3).map((video) => (
                <Link
                  href={`/videos/${video.id}`}
                  key={video.id}
                  className="bg-cyber-terminal border border-accent-blue/30 hover:border-accent-blue transition-all duration-300"
                >
                  <div className="aspect-video relative overflow-hidden">
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title || "Video thumbnail"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="font-terminal text-xs text-accent-blue truncate">
                      {video.title || "Untitled Video"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer - show on mobile */}
        <div className="lg:hidden font-terminal text-xs text-gray-500 border-t border-gray-800 pt-4 mt-8">
          <p className="mb-1">
            AUTHORIZED ACCESS ONLY • ONEIROCOM MONITORING ACTIVE
          </p>
          <p>
            REALITY STATUS:{" "}
            <span className="text-primary-500">AWAITING AGENT INPUT</span>
          </p>
        </div>
      </div>
    </div>
  );
}
