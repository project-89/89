import { useEffect, useRef } from "react";

/**
 * Hook for tracking the current scroll position
 * @returns A ref containing the current scroll position
 */
const useScrollPosition = () => {
  const scrollPosition = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollPosition.current = window.scrollY;
    };

    // Set initial position
    scrollPosition.current = window.scrollY;

    // Use passive listener for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return scrollPosition;
};

export default useScrollPosition;
