import posthog from 'posthog-js';
import { PostHogConfig } from 'posthog-js';

// Initialize PostHog
export const initAnalytics = () => {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    const config: Partial<PostHogConfig> = {
      api_host: 'https://us.i.posthog.com',
      capture_pageview: false, // We'll handle this manually for SPAs
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ['click', 'change', 'submit'],
        element_allowlist: ['button', 'input', 'select', 'textarea', 'a']
      },
      persistence: 'localStorage',
      bootstrap: {
        distinctID: undefined,
        isIdentifiedID: false
      }
    };

    posthog.init('phc_nhuYhDiHs4IDZZHvTMcG6Pw6ee5zcboAZxTD9cgzEF2', config);
  }
};

// Custom page view tracking
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      $host: window.location.host,
      $pathname: window.location.pathname,
      page_name: pageName,
      ...properties
    });
  }
};

// Generic event tracking
export const track = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    // Add common properties
    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      is_mobile: window.innerWidth < 768
    };
    
    posthog.capture(eventName, enrichedProperties);
  }
};

// User identification
export const identify = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, traits);
  }
};

// Update user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    posthog.people.set(properties);
  }
};

// Reset on logout
export const reset = () => {
  if (typeof window !== 'undefined') {
    posthog.reset();
  }
};

// Track timing events
export const trackTiming = (eventName: string, startTime: number, properties?: Record<string, any>) => {
  const duration = Date.now() - startTime;
  track(eventName, {
    ...properties,
    duration_ms: duration,
    duration_seconds: Math.round(duration / 1000)
  });
};

// Track errors
export const trackError = (errorType: string, error: any, context?: Record<string, any>) => {
  track('error_occurred', {
    error_type: errorType,
    error_message: error?.message || 'Unknown error',
    error_stack: error?.stack,
    ...context
  });
};

// Feature flag helpers
export const isFeatureEnabled = (flag: string): boolean => {
  if (typeof window !== 'undefined') {
    return posthog.isFeatureEnabled(flag) || false;
  }
  return false;
};

// Session replay helpers
export const startSessionRecording = () => {
  if (typeof window !== 'undefined') {
    posthog.startSessionRecording();
  }
};

export const stopSessionRecording = () => {
  if (typeof window !== 'undefined') {
    posthog.stopSessionRecording();
  }
};

// Get distinct ID for debugging
export const getDistinctId = (): string | undefined => {
  if (typeof window !== 'undefined') {
    return posthog.get_distinct_id();
  }
  return undefined;
};