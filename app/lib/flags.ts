// Simple feature flag helper. Replace with GrowthBook/PostHog integration later.

export function getFlag(name: string, provided?: Record<string, boolean>) {
  if (provided && name in provided) return !!provided[name];
  if (typeof window !== 'undefined') {
    const val = (window as unknown as { __flags?: Record<string, boolean> }).__flags?.[name];
    if (typeof val !== 'undefined') return !!val;
  }
  // default off
  return false;
}

export function exposeFlag(name: string, value: boolean) {
  // Hook where PostHog/GrowthBook exposure would be logged
  if (typeof window !== 'undefined') {
    const globalWindow = window as unknown as { __flags?: Record<string, boolean> };
    globalWindow.__flags = globalWindow.__flags || {};
    globalWindow.__flags[name] = value;
  }
}

