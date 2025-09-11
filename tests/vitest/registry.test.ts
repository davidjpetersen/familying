import { describe, it, expect } from 'vitest';
import { MicroApps } from '@/app/lib/apps/registry';

describe('registry selectors', () => {
  it('filters by plan and role and flag', () => {
    MicroApps.registerApp({
      id: 'test', slug: 'test', title: 'Test', icon: 'T', route: '/apps/test',
      allowedRoles: ['owner'], allowedPlans: ['plus'], dashboardSlots: ['home'], events: [], featureFlag: 'flag.test'
    });
    const visible = MicroApps.getVisibleApps({ user: { id: 'u', role: 'owner', plan: 'plus' }, flags: { 'flag.test': true } });
    expect(visible.find(a => a.id === 'test')).toBeTruthy();
    const hidden = MicroApps.getVisibleApps({ user: { id: 'u', role: 'child', plan: 'plus' }, flags: { 'flag.test': true } });
    expect(hidden.find(a => a.id === 'test')).toBeFalsy();
  });
});

