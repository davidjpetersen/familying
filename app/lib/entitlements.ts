import { MicroAppDefinition } from './apps/registry';

export type PlanKey = 'free' | 'plus' | 'family' | string;

export function isEntitled({ plan, app }: { plan: PlanKey; app: MicroAppDefinition }) {
  // Minimal stub: free -> only apps that include 'free'; otherwise require listed plan
  if (!app.allowedPlans || app.allowedPlans.length === 0) return true;
  return app.allowedPlans.includes(plan);
}

export function getUpsellCopy(app: MicroAppDefinition, plan: PlanKey) {
  if (isEntitled({ plan, app })) return null;
  const needed = app.allowedPlans.join(', ');
  return `This feature requires a ${needed} plan.`;
}

