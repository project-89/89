import { useEffect } from "react";

/**
 * Custom hook for handling keyboard shortcuts
 * SSR-safe and follows React best practices
 */
export function useKeyboardShortcut(
  key: string,
  handler: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined" || !enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === key) {
        handler();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [key, handler, enabled]);
}
