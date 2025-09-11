# ADR-001: Micro-Apps Architecture

- Context: We need an extensible way to add small, self-contained features (“micro-apps”) with role/plan gating, feature flags, and analytics.
- Decision: Introduce a typed registry (`app/lib/apps/registry.ts`) that describes each micro-app (id, slug, title, icon, route, allowedRoles/plans, optional ageBands, featureFlag, dashboardSlots, events). A `registerAll.ts` composes built-in apps. A dynamic route (`app/(protected)/apps/[slug]/page.tsx`) resolves by slug and lazy-loads the app module. A generic `AppTile` renders dashboard entries from the registry. Entitlements and flags use simple server/client helpers, with stubs to wire PostHog/GrowthBook later.
- Rationale: Central registry enables discoverability, gating, and analytics consistency. Lazy-loading keeps initial bundles small and lets us A/B via flags. Dashboard tiles render from a single source of truth.
- Trade-offs: Local registry requires a build to add apps (vs. remote plugins). Flag and entitlement stubs are placeholders. Kid gating is minimal (age bands optional). Playwright/Vitest added as stubs alongside Jest.
- Future: Replace stubs with GrowthBook/PostHog SDKs (server + client exposure logging), enrich entitlements from billing, add remote plugin loader, and unify test runners.

