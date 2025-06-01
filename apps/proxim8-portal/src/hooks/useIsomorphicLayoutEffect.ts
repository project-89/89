import { useEffect, useLayoutEffect } from "react";

/**
 * SSR-safe version of useLayoutEffect
 *
 * MODERN NEXT.JS NOTE: In App Router, prefer:
 * 1. 'use client' directive for client-only components
 * 2. Dynamic imports with { ssr: false } for SSR-incompatible components
 * 3. This hook only for progressive enhancement cases
 *
 * Use this when you need to:
 * - Measure DOM elements synchronously after render
 * - Set up subscriptions that must happen before paint
 * - Implement progressive enhancement patterns
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Hook to detect if we're on the client side
 *
 * @deprecated In modern Next.js App Router, prefer:
 * - 'use client' directive to mark client-only components
 * - Dynamic imports with { ssr: false } for SSR-incompatible components
 * - Suspense boundaries for loading states
 *
 * This pattern is kept for legacy compatibility only.
 */
export function useIsClient() {
  return typeof window !== "undefined";
}
