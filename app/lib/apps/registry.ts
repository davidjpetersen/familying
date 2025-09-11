import { ReactNode } from 'react';

export type Role = 'owner' | 'caregiver' | 'child';

export interface MicroAppDefinition {
  id: string; // e.g., "soundscapes"
  slug: string; // e.g., "soundscapes"
  title: string;
  icon: ReactNode | string;
  route: string; // e.g., "/apps/soundscapes"
  allowedRoles: Role[];
  allowedPlans: string[]; // entitlement keys like ["plus","family"]
  ageBands?: string[]; // optional child gating
  featureFlag?: string; // e.g., "apps.soundscapes.enabled"
  dashboardSlots?: ("home" | "kid" | "summary")[];
  events: string[]; // analytics event names
}

export interface VisibleAppsContext {
  user?: { id: string; role: Role; plan?: string } | null;
  child?: { id: string; ageBand?: string } | null;
  flags?: Record<string, boolean>;
}

import { isEntitled } from '../entitlements';
import { getFlag } from '../flags';

// Registry list; apps add themselves here
const registry: MicroAppDefinition[] = [];

export function registerApp(app: MicroAppDefinition) {
  // Avoid duplicate registration in RSC/fast refresh environments
  const exists = registry.find((a) => a.id === app.id);
  if (!exists) registry.push(app);
}

export function getApps() {
  return registry.slice();
}

export function getAppBySlug(slug: string) {
  return registry.find((a) => a.slug === slug);
}

export function getVisibleApps(ctx: VisibleAppsContext) {
  const plan = ctx.user?.plan ?? 'free';
  return registry.filter((app) => {
    // role
    if (ctx.user && !app.allowedRoles.includes(ctx.user.role)) return false;
    // plan entitlements
    if (!isEntitled({ plan, app })) return false;
    // flag
    if (app.featureFlag && !getFlag(app.featureFlag, ctx.flags)) return false;
    // child gating
    if (ctx.user?.role === 'child') {
      if (app.allowedRoles.includes('child')) {
        if (!app.ageBands) return true;
        const band = ctx.child?.ageBand;
        if (!band) return false;
        return app.ageBands.includes(band);
      }
      return false;
    }
    return true;
  });
}

// Export mutable registry with helpers
export const MicroApps = {
  registerApp,
  getApps,
  getAppBySlug,
  getVisibleApps,
};

