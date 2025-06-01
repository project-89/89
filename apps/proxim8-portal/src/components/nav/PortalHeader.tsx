"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWalletAuthStore } from "@/stores/walletAuthStore";
import { useLoreCount } from "@/hooks/useLoreCount";
import { useNftStore } from "@/stores/nftStore";
import dynamic from "next/dynamic";

const UnifiedWalletButton = dynamic(
  () =>
    import("@/components/wallet/UnifiedWalletButton").then((mod) => ({
      default: mod.UnifiedWalletButton,
    })),
  { ssr: false }
);

export function PortalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoreDropdown, setShowLoreDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  
  // Get unclaimed lore count and NFT store
  const { unclaimedCount } = useLoreCount();
  const userNfts = useNftStore((state) => state.userNfts);
  const hasProxim8s = userNfts && userNfts.length > 0;
  
  // Use wallet auth in useEffect to avoid SSR issues
  useEffect(() => {
    const checkAuth = () => {
      try {
        const store = useWalletAuthStore.getState();
        setIsAuthenticated(store.isAuthenticated);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
    
    // Subscribe to auth changes
    const unsubscribe = useWalletAuthStore.subscribe(
      (state) => setIsAuthenticated(state.isAuthenticated)
    );
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideMenu = mobileMenuRef.current && !mobileMenuRef.current.contains(target);
      const isOutsideButton = mobileButtonRef.current && !mobileButtonRef.current.contains(target);
      
      if (isOutsideMenu && isOutsideButton) {
        console.log('Clicking outside mobile menu, closing');
        setShowMobileMenu(false);
      }
    }

    if (showMobileMenu) {
      // Add a small delay to prevent immediate closing when opening
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMobileMenu]);

  const navItems = [
    { path: "/", label: "PORTAL" },
    { path: "/my-proxim8s", label: "AGENTS" },
    { path: "/lore", label: "LORE" },
    { path: "/missions", label: "MISSIONS" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
      <div
        className={`bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-full px-6 py-3 flex items-center justify-between w-[95%] mx-auto transition-all duration-800 ease-out ${
          isLoaded
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="flex items-center space-x-6">
          {/* Mobile Menu Button + Logo - Mobile */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Mobile Menu Button - Only show when authenticated */}
            {isAuthenticated && (
              <button
                ref={mobileButtonRef}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Mobile menu button clicked, current state:', showMobileMenu);
                  setShowMobileMenu(!showMobileMenu);
                }}
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showMobileMenu ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            )}
            
            {/* Logo */}
            <div
              className="font-orbitron font-bold text-primary-500 relative cursor-pointer"
              onClick={() => router.push("/")}
            >
              PROJECT 89
              <span className="absolute -inset-1 opacity-30 blur-sm animate-pulse text-primary-500">
                PROJECT 89
              </span>
            </div>
          </div>

          {/* Logo - Desktop */}
          <div
            className="hidden md:block font-orbitron font-bold text-primary-500 relative cursor-pointer"
            onClick={() => router.push("/")}
          >
            PROJECT 89
            <span className="absolute -inset-1 opacity-30 blur-sm animate-pulse text-primary-500">
              PROJECT 89
            </span>
          </div>

          {/* Desktop Navigation - Only show when authenticated */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`font-space-mono text-xs transition-colors ${
                    pathname === item.path
                      ? "text-primary-500"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* Status indicator */}
          <div className="hidden lg:flex items-center text-xs text-gray-400 font-space-mono">
            <span className="text-red-400 animate-pulse mr-1">▲</span>
            REALITY_STATUS: <span className="text-red-400 ml-1">COMPROMISED</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Purchase CTA if no NFTs */}
          {isAuthenticated && !hasProxim8s && (
            <button
              onClick={() => window.open('https://launchmynft.io/sol/16033', '_blank')}
              className="hidden md:flex items-center gap-2 font-space-mono text-xs px-4 py-2 bg-primary-500/80 text-white border border-primary-400/50 rounded hover:bg-primary-500 hover:border-primary-400 transition-all"
            >
              <span>GET PROXIM8 AGENTS</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
          
          {/* Lore Notification Icon - Clean version */}
          {isAuthenticated && hasProxim8s && unclaimedCount > 0 && (
            <div className="relative lore-dropdown-container">
              <button
                onClick={() => setShowLoreDropdown(!showLoreDropdown)}
                className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {unclaimedCount > 9 ? "9+" : unclaimedCount}
                </span>
              </button>
              
              {/* Clean Dropdown */}
              {showLoreDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                    <p className="font-orbitron text-sm text-primary-500">
                      NEW LORE AVAILABLE
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="font-space-mono text-xs text-gray-300 mb-3">
                      {unclaimedCount} memory {unclaimedCount === 1 ? 'fragment' : 'fragments'} recovered from the quantum substrate.
                    </p>
                    <button
                      onClick={() => {
                        setShowLoreDropdown(false);
                        router.push("/lore");
                      }}
                      className="w-full font-space-mono text-xs px-4 py-2 bg-primary-500/20 border border-primary-500 rounded hover:bg-primary-500/30 transition-all text-primary-500"
                    >
                      CLAIM LORE
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Wallet button */}
          <div className="wallet-button-wrapper relative z-50">
            <UnifiedWalletButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isAuthenticated && showMobileMenu && (
        <div ref={mobileMenuRef} className="md:hidden fixed top-20 left-0 right-0 z-40 mx-4">
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-lg overflow-hidden">
            <nav className="py-2">
              {navItems.map((item, index) => (
                <button
                  key={item.path}
                  onClick={() => {
                    router.push(item.path);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full px-6 py-3 text-left font-space-mono text-sm transition-colors flex items-center justify-between ${
                    pathname === item.path
                      ? "text-primary-500 bg-primary-500/10"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.path === "/lore" && unclaimedCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                      {unclaimedCount > 9 ? "9+" : unclaimedCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}