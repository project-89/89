import { QueryClient } from "@tanstack/react-query";

// Create a client with sensible default configurations
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default cache time of 5 minutes (300000ms)
      staleTime: 1000 * 60 * 5,
      // Retry failed queries 1 time before showing error
      retry: 1,
      // Don't refetch when window regains focus
      refetchOnWindowFocus: false,
      // Don't refetch on component mount if data exists
      refetchOnMount: false,
    },
  },
});
