# Pluggable Micro‑Services Architecture

**Context:** Extend the app via self‑contained micro‑services (“plugins”) implemented as independent Node packages. Plugins are **enabled by default**, discovered by the host at boot, and registered via lifecycle hooks. **AuthN/AuthZ is centralized with Clerk.com.** No permission manifests for now. **Not hot‑swappable**—changes require an app restart. CI/CD is **out of scope** for implementation today but the structure should be CI‑ready.

---

## 1) Goals & Non‑Goals

**Goals**
- Enable rapid addition of new features as discrete, self‑contained packages.
- Keep clear boundaries: code, routes, migrations, UI, and tests live within the plugin.
- Provide a standard lifecycle for **register()** and **deregister()**.
- Centralize **authentication & authorization via Clerk**; plugins consume shared guards and helpers.
- Ship with a minimal **admin surface** and **user‑facing routes** per plugin.

**Non‑Goals**
- No runtime hot‑swap (restarts required).
- No plugin marketplace (install/enable/disable flows) at this time.
- No fine‑grained per‑resource permission manifests yet.

---

## 2) Host Application Responsibilities

- **Plugin Discovery:**
  - Load plugins from a configured set of directories (e.g., `./packages/services/*`).
  - Validate presence of required files (`package.json`, `plugin.manifest.json`, `src/index.ts`).

- **Registration Lifecycle:**
  - Call `register(ctx)` at boot; call `deregister(ctx)` during shutdown.
  - Maintain an in‑memory **PluginRegistry** of active plugins: `{ name, version, routes, migrations, health }`.

- **Clerk Integration:**
  - Provide **Clerk‑aware middlewares**: `requireAuth`, `withRoles(roles: string[])`.
  - Expose a shared `AuthZ` helper: `{ isAdmin(user), hasRole(user, role), assertRole(user, role) }`.

- **Shared Services:**
  - Logging (`logger`), config (`config`), database connection (`db`), event bus or pub/sub (optional).

- **Routing Mounts:**
  - Mount user routes under `/app/<plugin-name>/…`.
  - Mount admin routes under `/admin/<plugin-name>/…`, protected by admin guard.

- **Migrations Runner:**
  - Run plugin migrations at startup in dependency order: core → plugins.
  - Each plugin exposes reversible migrations (up/down). Fail fast; surface status in logs.

---

## 3) Plugin Package Contract

Every plugin is a Node package with the following minimal shape.

```
packages/services/<plugin-name>/
├─ package.json
├─ plugin.manifest.json
├─ src/
│  ├─ index.ts              # exports register/deregister
│  ├─ routes.user.ts        # user routes
│  ├─ routes.admin.ts       # admin routes
│  ├─ ui/                   # optional shared components
│  ├─ config.ts             # schema + defaults
│  └─ service.ts            # plugin business logic
├─ migrations/
│  ├─ 0001_init.sql         # or .ts if using a framework
│  └─ 0002_add_indexes.sql
├─ tests/
│  └─ plugin.spec.ts
└─ README.md
```

### 3.1 `package.json`

- Declare all dependencies just like any Node package.
- Use `exports` to expose typed entry points if needed.

```json
{
  "name": "@app/services-example",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p .",
    "dev": "ts-node src/index.ts",
    "test": "vitest run",
    "migrate": "node dist/migrate.js"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "peerDependencies": {
    "@clerk/clerk-sdk-node": "*"
  }
}
```

### 3.2 `plugin.manifest.json`

- Minimal metadata plus declared mounts.

```json
{
  "name": "example",
  "displayName": "Example Service",
  "version": "0.1.0",
  "author": "Team",
  "description": "Demonstration plugin",
  "routes": {
    "user": ["/app/example", "/app/example/:id"],
    "admin": ["/admin/example", "/admin/example/settings"]
  },
  "migrations": ["migrations/0001_init.sql", "migrations/0002_add_indexes.sql"],
  "configSchemaRef": "#config"
}
```

### 3.3 Lifecycle API (`src/index.ts`)

```ts
import type { PluginContext } from "@app/host/types";

export async function register(ctx: PluginContext) {
  const { router, adminRouter, logger, auth, db, config } = ctx;

  // Mount user routes
  const userRoutes = await import("./routes.user");
  router.use("/app/example", auth.requireAuth, userRoutes.default({ db, logger }));

  // Mount admin routes (admin‑guarded)
  const adminRoutes = await import("./routes.admin");
  adminRouter.use(
    "/admin/example",
    auth.requireAuth,
    auth.withRoles(["admin"]),
    adminRoutes.default({ db, logger, config })
  );

  logger.info({ plugin: "example" }, "registered");
}

export async function deregister(ctx: PluginContext) {
  // Optional: close internal resources (schedulers, queues)
  ctx.logger.info({ plugin: "example" }, "deregistered");
}
```

### 3.4 Routing Conventions

- **User**: `/app/<plugin>/**` guarded by `requireAuth`.
- **Admin**: `/admin/<plugin>/**` guarded by `requireAuth` + `withRoles(["admin"])`.
- Use namespaced API paths `/api/<plugin>/…` for JSON endpoints.

### 3.5 Config & Secrets

- Each plugin defines a config schema and default values; the host merges env overrides.

```ts
// src/config.ts
import { z } from "zod";

export const ConfigSchema = z.object({
  FEATURE_ENABLED: z.boolean().default(true),
  LIMIT: z.number().int().positive().default(100)
});

export type Config = z.infer<typeof ConfigSchema>;
```

Host exposes `config.get(pluginName)` → parsed, validated config.

---

## 4) Database Migrations

- Each plugin **owns its migrations** under `migrations/` and must support **up/down**.
- Prefer idempotent SQL where possible; otherwise ship reversible steps.
- Host runs migrations in order at startup; on failure, abort boot and log errors with plugin name and file.
- Naming: `YYYYMMDDHHmm_<slug>.sql` or incremental `0001_*.sql`.

**Example (SQL)**
```sql
-- 0001_init.sql (up)
CREATE TABLE IF NOT EXISTS example_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_example_owner ON example_items(owner_id);
```

---

## 5) Authentication & Authorization (Clerk)

- Host provides Clerk middleware and helpers; plugins **never talk to Clerk directly**.
- Standard helpers:
  - `requireAuth(req, res, next)` → ensures a valid Clerk session.
  - `withRoles([roles])` → checks roles on the user’s session.
  - `isAdmin(user)` and `hasRole(user, role)` utilities.
- Admin routes **must** stack `requireAuth` + `withRoles(["admin"])`.

---

## 6) Error Handling & Observability

- Provide a shared error utility for consistent HTTP error shapes: `{ code, message, details }`.
- Plugins use host `logger` and structured logs `{ plugin, route, userId, err }`.
- Optional: healthcheck endpoint per plugin `/api/<plugin>/health` returning `{ status: 'ok' }`.

---

## 7) Testing Scaffold (CI‑Ready)

- Each plugin includes unit tests (logic) and minimal integration tests (routes behind mocked Clerk).
- Standard script names: `test`, `lint`, `typecheck` to make future CI trivial.

```bash
# In each plugin
npm run lint
npm run typecheck
npm run test
```

---

## 8) Developer Experience

- **Generator:** Provide a `create:plugin` script (Node/Plop/Turbo) to scaffold the structure above.
- **Local Dev:** Host reads `services/*/plugin.manifest.json` and registers all on boot.
- **Docs:** Each plugin ships a `README.md` with install notes, routes, env vars, and migration notes.

---

## 9) Minimal Example Template (copy/paste)

```
# files
package.json
plugin.manifest.json
src/index.ts
src/routes.user.ts
src/routes.admin.ts
src/config.ts
migrations/0001_init.sql

# package.json
audited as above

# plugin.manifest.json
{
  "name": "example",
  "version": "0.1.0",
  "routes": { "user": ["/app/example"], "admin": ["/admin/example"] },
  "migrations": ["migrations/0001_init.sql"]
}

# src/routes.user.ts
export default function routes({ db, logger }) { /* return an Express/Nitro router */ }

# src/routes.admin.ts
export default function routes({ db, logger, config }) { /* admin endpoints */ }

# src/index.ts
export { register, deregister } from "./register"; // as defined above
```

---

## 10) Acceptance Criteria Checklist

- [ ] Host discovers and registers all plugins under `packages/services/*`.
- [ ] Each plugin builds independently; dependencies declared in its own `package.json`.
- [ ] Admin and user routes mount under the specified namespaces and are Clerk‑guarded.
- [ ] Migrations run at startup; failures abort boot with clear logs.
- [ ] Plugins can be deregistered cleanly at shutdown.
- [ ] Documentation exists per plugin (README + manifest).

---

## 11) Future‑Proofing (No action now)

- CI pipelines to run `lint`, `typecheck`, `test`, and migration dry‑runs.
- Optional inter‑plugin dependency graph and ordered registration.
- Feature flags per plugin via centralized config.
- Gradual introduction of permission manifests and capability descriptors if needed.

