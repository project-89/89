/// <reference types="node" />

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, any>) => void;
      identify: (distinctId: string, properties?: Record<string, any>) => void;
      reset: () => void;
      people: {
        set: (properties: Record<string, any>) => void;
      };
      isFeatureEnabled: (flag: string) => boolean;
      startSessionRecording: () => void;
      stopSessionRecording: () => void;
      get_distinct_id: () => string | undefined;
      __loaded?: boolean;
    };
  }
}

export {};