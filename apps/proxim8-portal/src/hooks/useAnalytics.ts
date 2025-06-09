import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { 
  track, 
  identify, 
  trackPageView, 
  trackTiming, 
  trackError,
  setUserProperties,
  initAnalytics 
} from '@/utils/analytics';
import { useWalletAuthStore } from '@/stores/walletAuthStore';
import { useNftStore } from '@/stores/nftStore';

export const useAnalytics = () => {
  const pathname = usePathname();
  const pageStartTime = useRef<number>(Date.now());
  const lastPathname = useRef<string>(pathname);
  
  // Get auth and NFT state
  const { isAuthenticated, walletAddress } = useWalletAuthStore();
  const userNfts = useNftStore((state) => state.userNfts);

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (pathname !== lastPathname.current) {
      // Track time spent on previous page
      if (lastPathname.current) {
        trackTiming('page_time_spent', pageStartTime.current, {
          page_name: lastPathname.current,
          next_page: pathname
        });
      }

      // Track new page view
      const pageName = pathname === '/' ? 'portal_home' : pathname.slice(1).replace(/\//g, '_');
      trackPageView(pageName, {
        is_authenticated: isAuthenticated,
        has_proxim8s: userNfts && userNfts.length > 0,
        proxim8_count: userNfts?.length || 0
      });

      // Update refs
      pageStartTime.current = Date.now();
      lastPathname.current = pathname;
    }
  }, [pathname, isAuthenticated, userNfts]);

  // Identify user when wallet connects
  useEffect(() => {
    if (isAuthenticated && walletAddress) {
      identify(walletAddress, {
        $set: {
          wallet_address: walletAddress,
          has_proxim8s: userNfts && userNfts.length > 0,
          proxim8_count: userNfts?.length || 0,
          last_seen: new Date().toISOString()
        },
        $set_once: {
          first_seen: new Date().toISOString()
        }
      });
    }
  }, [isAuthenticated, walletAddress, userNfts]);

  // Analytics methods
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    const enrichedProperties = {
      ...properties,
      is_authenticated: isAuthenticated,
      wallet_address: walletAddress,
      has_proxim8s: userNfts && userNfts.length > 0,
      proxim8_count: userNfts?.length || 0,
      current_page: pathname
    };
    track(eventName, enrichedProperties);
  }, [isAuthenticated, walletAddress, userNfts, pathname]);

  const trackTimingEvent = useCallback((eventName: string, startTime: number, properties?: Record<string, any>) => {
    const enrichedProperties = {
      ...properties,
      is_authenticated: isAuthenticated,
      current_page: pathname
    };
    trackTiming(eventName, startTime, enrichedProperties);
  }, [isAuthenticated, pathname]);

  const trackErrorEvent = useCallback((errorType: string, error: any, context?: Record<string, any>) => {
    const enrichedContext = {
      ...context,
      is_authenticated: isAuthenticated,
      current_page: pathname,
      wallet_address: walletAddress
    };
    trackError(errorType, error, enrichedContext);
  }, [isAuthenticated, pathname, walletAddress]);

  const updateUserProperties = useCallback((properties: Record<string, any>) => {
    setUserProperties(properties);
  }, []);

  return {
    track: trackEvent,
    trackTiming: trackTimingEvent,
    trackError: trackErrorEvent,
    updateUserProperties,
    identify,
    trackPageView
  };
};