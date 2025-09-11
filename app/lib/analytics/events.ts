type EventName =
  | 'soundscape_started'
  | 'timer_set'
  | 'bedtime_mode_on'
  | 'soundscape_favorited'
  | 'soundscape_completed';

interface AnalyticsPayload {
  name: EventName;
  props?: Record<string, unknown>;
}

// Replace with PostHog client/server helpers. Ensure no child PII is sent.
export function track({ name, props }: AnalyticsPayload) {
  if (typeof window !== 'undefined' && (window as unknown as { posthog?: { capture: (name: string, props?: Record<string, unknown>) => void } }).posthog) {
    (window as unknown as { posthog: { capture: (name: string, props?: Record<string, unknown>) => void } }).posthog.capture(name, props);
  } else {
    // noop or console for development
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[analytics] ${name}`, props || {});
    }
  }
}

export const Analytics = { track };

