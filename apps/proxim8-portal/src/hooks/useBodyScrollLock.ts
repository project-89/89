import { useEffect } from "react";

/**
 * Custom hook for locking/unlocking body scroll
 * SSR-safe and follows React best practices
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (isLocked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalStyle;
    }

    // Cleanup on unmount or when isLocked changes
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
}
