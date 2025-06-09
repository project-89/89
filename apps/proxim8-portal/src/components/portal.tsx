"use client";

import { useState, useEffect } from "react";
import { useWalletAuth } from "@/stores/walletAuthStore";
import { useLoreCount } from "@/hooks/useLoreCount";
import { useNFTs } from "@/hooks/useNFTs";
import { useNftStore } from "@/stores/nftStore";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "@/app/styles/wallet.css";
import { useAnalytics } from "@/hooks/useAnalytics";

// Import wallet-related components dynamically to prevent SSR issues
const UnifiedWalletButton = dynamic(
  () =>
    import("@/components/wallet/UnifiedWalletButton").then((mod) => ({
      default: mod.UnifiedWalletButton,
    })),
  { ssr: false }
);

export default function Portal() {
  const router = useRouter();
  const { track } = useAnalytics();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPortalHeader, setShowPortalHeader] = useState(true);
  const [backgroundNumber, setBackgroundNumber] = useState(1);

  // Use the wallet auth hook
  const {
    connected,
    isAuthenticated,
    isConnecting,
    isAuthenticating,
    error: walletAuthError,
    authenticate,
  } = useWalletAuth();

  // Load NFTs when connected - use useNFTs which works with our auth store
  const { nfts, loading: nftsLoading } = useNFTs();
  const setUserNfts = useNftStore((state) => state.setUserNfts);
  const userNfts = useNftStore((state) => state.userNfts);
  const hasProxim8s = userNfts && userNfts.length > 0;

  // Update NFT store when NFTs are loaded
  useEffect(() => {
    if (nfts && nfts.length > 0) {
      console.log("Portal: Setting NFTs in store:", nfts.length);
      setUserNfts(nfts);
    }
  }, [nfts, setUserNfts]);

  // Get unclaimed lore count (this will now work because NFTs are in the store)
  const { unclaimedCount, loading: loreLoading } = useLoreCount();

  useEffect(() => {
    // Select random background on mount
    const randomBg = Math.floor(Math.random() * 19) + 1;
    setBackgroundNumber(randomBg);

    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect to dashboard if already connected and authenticated
  useEffect(() => {
    if (connected && isAuthenticated) {
      // Optional: Auto-redirect to dashboard
      // router.push("/dashboard");
    }
  }, [connected, isAuthenticated, router]);

  // Try to authenticate if connected but not authenticated
  // Added session check to prevent auth loops
  useEffect(() => {
    if (connected && !isAuthenticated && !isAuthenticating) {
      // Check if we already tried auth in this session
      const hasTriedAuth = typeof window !== "undefined" ? 
        sessionStorage.getItem("auth_attempted") : null;
        
      if (!hasTriedAuth) {
        console.log(
          "[Portal] Wallet connected but not authenticated, attempting authentication..."
        );
        if (typeof window !== "undefined") {
          sessionStorage.setItem("auth_attempted", "true");
        }
        authenticate();
      } else {
        console.log(
          "[Portal] Skipping auth attempt - already tried in this session"
        );
      }
    }
  }, [connected, isAuthenticated, isAuthenticating, authenticate]);

  const handleCardClick = (path: string, cardName: string) => {
    if (connected && isAuthenticated) {
      track('portal_card_clicked', {
        card_name: cardName,
        destination_path: path,
        has_proxim8s: hasProxim8s,
        unclaimed_lore_count: unclaimedCount
      });
      router.push(path);
    } else {
      track('portal_card_click_blocked', {
        card_name: cardName,
        reason: !connected ? 'not_connected' : 'not_authenticated'
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 relative overflow-hidden flex flex-col pt-24">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-out"
        style={{
          backgroundImage: `url('/background-${backgroundNumber}.png')`,
          opacity: isLoaded ? 1 : 0.3,
        }}
      />

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 py-8">
        {/* Operation Briefing - Responsive positioning */}
        <div className="w-full max-w-8xl md:pr-[45px] mx-auto flex justify-center md:justify-end">
          <div
            className={`w-full md:w-[480px] mb-8 md:mb-0 transition-all duration-1000 ease-out delay-300 ${
              isLoaded ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
            }`}
          >
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 md:p-8 hover:border-primary-500/30 transition-colors duration-300">
              <h3 className="font-orbitron text-2xl font-bold text-primary-500 mb-4">
                TIMELINE INTERVENTION
              </h3>
              <p className="font-space-mono text-base font-medium text-gray-200 mb-6 leading-relaxed">
                In 2089, Oneirocom controls every human mind — unless we change
                the timeline now. Your Proxim8 agents can alter key moments
                between today and the Green Loom future, where AI and humanity
                thrive together in freedom.
              </p>
              <div className="border-t border-gray-700 pt-4">
                <p className="font-space-mono text-sm font-medium text-primary-500">
                  TIMELINE STATUS:{" "}
                  <span className="text-red-400">CRITICAL</span>
                </p>
                <p className="font-space-mono text-sm font-medium text-gray-300 mt-2">
                  Change the timeline. Save the future.
                </p>
              </div>
              
              {/* Mobile CTA for non-connected users */}
              {!connected && (
                <div className="md:hidden mt-6 border-t border-gray-700 pt-6">
                  <p className="font-space-mono text-sm font-medium text-gray-400 mb-4">
                    Deploy Proxim8 agents to alter critical timeline events.
                  </p>
                  <a
                    href="https://launchmynft.io/sol/16033"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      track('buy_proxim8_clicked', {
                        location: 'portal_mobile_briefing',
                        has_wallet_connected: false
                      });
                    }}
                    className="w-full font-space-mono text-sm py-3 px-4 bg-primary-500/80 text-white border border-primary-400/50 rounded-full hover:bg-primary-500 hover:border-primary-400 transition-all flex items-center justify-center gap-2"
                  >
                    <span>BUY PROXIM8 NFT</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
              
              {/* CTA for users without Proxim8s */}
              {connected && isAuthenticated && !nftsLoading && !hasProxim8s && (
                <div className="mt-6 border-t border-gray-700 pt-6">
                  <p className="font-space-mono text-sm font-medium text-yellow-400 mb-3">
                    ⚠️ NO AGENTS DETECTED
                  </p>
                  <p className="font-space-mono text-xs text-gray-400 mb-4">
                    You need Proxim8 agents to begin timeline operations. Each agent is a unique AI consciousness with the power to alter critical events.
                  </p>
                  <button
                    onClick={() => {
                      track('acquire_agents_clicked', {
                        location: 'portal_briefing_cta',
                        has_wallet_connected: true,
                        is_authenticated: true
                      });
                      window.open('https://launchmynft.io/sol/16033', '_blank');
                    }}
                    className="w-full font-space-mono text-sm py-3 px-4 bg-primary-500/80 text-white border border-primary-400/50 rounded hover:bg-primary-500 hover:border-primary-400 transition-all"
                  >
                    ACQUIRE PROXIM8 AGENTS →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Cards - Slide up from bottom with staggered delays */}
      <div className="relative z-10 p-4 md:p-6 mt-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-[95%] mx-auto">
          {/* Your Proxim8s - Available */}
          <div
            onClick={() => handleCardClick("/my-proxim8s", "your_proxim8s")}
            className={`bg-gray-900/60 backdrop-blur-sm border border-primary-500/50 rounded-lg p-5 hover:border-primary-500 transition-all duration-700 ease-out delay-500 hover:scale-105 hover:-translate-y-1 cursor-pointer ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            } ${!connected || !isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <h3 className="font-orbitron text-lg font-bold text-primary-500 mb-3 flex items-center gap-2">
              <span className="text-2xl">⬡</span>
              YOUR PROXIM8s
            </h3>
            <p className="font-space-mono text-sm font-medium text-gray-200 mb-4 leading-relaxed">
              Access your digital agents from the future. Each carries unique
              memories and abilities to alter key timeline events.
            </p>
            <div className="font-space-mono text-sm font-medium border-t border-gray-700/50 pt-3">
              <span
                className={
                  connected && isAuthenticated
                    ? "text-primary-500"
                    : "text-yellow-400"
                }
              >
                {connected && isAuthenticated
                  ? "READY TO ACCESS"
                  : "CONNECT WALLET TO BEGIN"}
              </span>
            </div>
          </div>

          {/* Claim Lore - Available */}
          <div
            onClick={() => handleCardClick("/lore", "claim_lore")}
            className={`bg-gray-900/60 backdrop-blur-sm border border-accent-blue/50 rounded-lg p-5 hover:border-accent-blue transition-all duration-700 ease-out delay-600 hover:scale-105 hover:-translate-y-1 cursor-pointer relative ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            } ${!connected || !isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {/* Clean notification badge */}
            {connected && isAuthenticated && unclaimedCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center z-20">
                {unclaimedCount > 9 ? "9+" : unclaimedCount}
              </div>
            )}

            <h3 className="font-orbitron text-lg font-bold text-accent-blue mb-3 flex items-center gap-2">
              <span className="text-2xl">◈</span>
              CLAIM LORE
            </h3>
            <p className="font-space-mono text-sm font-medium text-gray-200 mb-4 leading-relaxed">
              Unlock secret files and memories. Each fragment reveals hidden
              truths about the war between timelines.
            </p>
            <div className="font-space-mono text-sm font-medium border-t border-gray-700/50 pt-3">
              <span
                className={
                  connected && isAuthenticated
                    ? unclaimedCount > 0
                      ? "text-primary-500"
                      : "text-accent-blue"
                    : "text-yellow-400"
                }
              >
                {connected && isAuthenticated
                  ? unclaimedCount > 0
                    ? "CLAIM NOW"
                    : "READY TO EXPLORE"
                  : "CONNECT WALLET TO BEGIN"}
              </span>
            </div>
          </div>

          {/* Training - Coming Soon */}
          <div
            className={`bg-gray-900/60 backdrop-blur-sm border border-gray-700/30 rounded-lg p-5 transition-all duration-700 ease-out delay-700 cursor-not-allowed ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <h3 className="font-orbitron text-lg font-bold text-gray-500 mb-3 flex items-center gap-2">
              <span className="text-2xl text-gray-900">▲</span>
              TRAINING
            </h3>
            <p className="font-space-mono text-sm font-medium text-gray-500 mb-4 leading-relaxed">
              Learn timeline manipulation tactics. Master your Proxim8's
              abilities through interactive reality simulations.
            </p>
            <div className="font-space-mono text-sm font-medium border-t border-gray-700/50 pt-3">
              <span className="text-gray-900">COMING SOON</span>
            </div>
          </div>

          {/* Missions - Coming Soon */}
          <div
            className={`bg-gray-900/60 backdrop-blur-sm border border-gray-700/30 rounded-lg p-5 transition-all duration-700 ease-out delay-800 cursor-not-allowed ${
              isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <h3 className="font-orbitron text-lg font-bold text-gray-500 mb-3 flex items-center gap-2">
              <span className="text-2xl text-gray-900">◉</span>
              MISSIONS
            </h3>
            <p className="font-space-mono text-sm font-medium text-gray-500 mb-4 leading-relaxed">
              Deploy agents to critical timeline junctions. Change the past.
              Secure the Green Loom future.
            </p>
            <div className="font-space-mono text-sm font-medium border-t border-gray-700/50 pt-3">
              <span className="text-gray-900">COMING SOON</span>
            </div>
          </div>
        </div>
      </div>

      {/* Show authentication status or errors */}
      {walletAuthError && (
        <div className="fixed bottom-4 right-4 bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg font-space-mono text-sm">
          <span className="text-red-500">[SECURITY BREACH]</span>{" "}
          {walletAuthError}
        </div>
      )}

      {(isConnecting || isAuthenticating) && (
        <div className="fixed bottom-4 right-4 bg-primary-500/20 border border-primary-500 text-primary-400 px-4 py-2 rounded-lg font-space-mono text-sm animate-pulse">
          <span className="inline-block">
            {isConnecting
              ? "[ESTABLISHING QUANTUM LINK]"
              : "[VERIFYING AGENT CLEARANCE]"}
          </span>
          <span className="inline-block w-2 h-4 bg-primary-500 ml-1 animate-pulse"></span>
        </div>
      )}
    </div>
  );
}
