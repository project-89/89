"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { UnifiedWalletButton } from "@/components/wallet/UnifiedWalletButton";
// import { NotificationBell } from "../notifications/NotificationBell";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface HeaderInteractiveProps {
  isActive: (path: string) => boolean;
}

export default function HeaderInteractive({
  isActive: _isActive, // We don't use the passed function
}: HeaderInteractiveProps) {
  const { publicKey, connected } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Define our own isActive function that uses pathname
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Memoized handlers to prevent unnecessary re-renders
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const toggleMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  }, []);

  // Custom hooks for better separation of concerns
  const mobileMenuRef = useClickOutside<HTMLDivElement>(closeMenu, isMenuOpen, [
    hamburgerButtonRef,
  ]);
  useKeyboardShortcut("Escape", closeMenu, isMenuOpen);
  useBodyScrollLock(isMenuOpen);

  // Close mobile menu when wallet connection changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [connected]);

  return (
    <>
      <div className="flex items-center space-x-4">
        {/* Mobile-only notification bell - positioned before hamburger */}
        {/* {connected && publicKey && (
          <div className="md:hidden">
            <NotificationBell />
          </div>
        )} */}

        {/* Hamburger menu button - only visible on mobile */}
        <button
          onClick={toggleMenu}
          ref={hamburgerButtonRef}
          className="md:hidden flex items-center justify-center w-8 h-8 text-primary-500 hover:text-primary-400 focus:outline-none"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
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

        {/* Desktop-only elements */}
        <div className="hidden md:flex items-center space-x-4">
          {/* {connected && publicKey && <NotificationBell />} */}
          <UnifiedWalletButton />
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-cyber-terminal border-t border-primary-500/30 shadow-neon z-50 mobile-menu-enter"
          role="navigation"
          aria-label="Mobile navigation menu"
        >
          <div className="container mx-auto px-4 py-2 space-y-1">
            {/* Wallet connection in mobile menu */}
            <div className="py-3 border-b border-primary-500/20 mb-2">
              <UnifiedWalletButton />
            </div>

            <Link
              href="/"
              className={`block py-3 px-3 text-base font-terminal uppercase transition-colors ${
                isActive("/")
                  ? "text-primary-500 bg-primary-500/10 border-l-2 border-primary-500"
                  : "text-gray-300 hover:bg-primary-500/5 hover:text-primary-400"
              }`}
              onClick={closeMenu}
            >
              {">"} Home
            </Link>
            <Link
              href="/nfts"
              className={`block py-3 px-3 text-base font-terminal uppercase transition-colors ${
                isActive("/nfts")
                  ? "text-primary-500 bg-primary-500/10 border-l-2 border-primary-500"
                  : "text-gray-300 hover:bg-primary-500/5 hover:text-primary-400"
              }`}
              onClick={closeMenu}
            >
              {">"} Agents
            </Link>
            {/* <Link
              href="/videos"
              className={`block py-3 px-3 text-base font-terminal uppercase transition-colors ${
                isActive("/videos")
                  ? "text-primary-500 bg-primary-500/10 border-l-2 border-primary-500"
                  : "text-gray-300 hover:bg-primary-500/5 hover:text-primary-400"
              }`}
              onClick={closeMenu}
            >
              {">"} Videos
            </Link> */}
            <Link
              href="/lore"
              className={`block py-3 px-3 text-base font-terminal uppercase transition-colors ${
                isActive("/lore")
                  ? "text-accent-magenta bg-accent-magenta/10 border-l-2 border-accent-magenta"
                  : "text-gray-300 hover:bg-accent-magenta/5 hover:text-accent-magenta"
              }`}
              onClick={closeMenu}
            >
              {">"} Lore
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
