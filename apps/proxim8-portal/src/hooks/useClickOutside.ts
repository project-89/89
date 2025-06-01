import { useEffect, useRef, RefObject } from "react";

/**
 * Custom hook for detecting clicks outside of specified elements
 * SSR-safe and follows React best practices
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  enabled: boolean = true,
  excludeRefs: RefObject<HTMLElement>[] = []
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined" || !enabled) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is inside the main ref
      if (ref.current && ref.current.contains(target)) {
        return;
      }

      // Check if click is inside any excluded refs
      const isInsideExcludedElement = excludeRefs.some(
        (excludeRef) =>
          excludeRef.current && excludeRef.current.contains(target)
      );

      if (!isInsideExcludedElement) {
        handler();
      }
    };

    // Use a small delay to avoid immediate triggering
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handler, enabled, excludeRefs]);

  return ref;
}
