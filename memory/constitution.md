# Familying.org Constitution

*This living document defines the non‑negotiable principles, standards, and guardrails for building Familying.org across product, engineering, design, data, content, growth, and operations. It prioritizes safety, trust, and practical value for real families.*

---

## Core Principles

### I. Family‑First Outcomes (Quick Wins)

Every first‑use must deliver a concrete improvement to family life within 5 minutes (e.g., a ready‑to‑use calm activity, a one‑tap weekly meal plan, or a conversation starter).  
**Acceptance criteria**: A brand‑new parent profile reaches an “aha moment” in ≤5 minutes with no prior training. “No Quick Win, no launch.”

### II. Safety & Privacy by Design (Non‑Negotiable)

Age‑aware flows, explicit caregiver consent, and data minimization are mandatory. We avoid collecting child PII unless essential, apply least‑privilege access, and provide transparent controls for what’s stored, why, and for how long. All child‑facing surfaces are designed to prevent unsafe content and wandering.

### III. Inclusive & Accessible by Default

We design for diverse families (LGBTQ+, blended, foster/adoptive, immigrant, multigenerational) and for varied abilities, bandwidth, and devices. We target WCAG 2.2 AA, plain‑language reading levels, captions/transcripts, large‑tap targets, and offline/low‑bandwidth modes for key resources.

### IV. Library‑First, Interface‑Agnostic Services

Every capability ships first as an independently testable library with a CLI/text I/O contract (stdin/args → stdout; errors → stderr) and semantic versioning. UIs and automations consume these contracts. This enables local testing, scriptability, and reliable reuse.

### V. Test‑First & Observability Everywhere

TDD/BDD are expected for new logic. Contract tests protect service boundaries; synthetic persona tests validate equity and usability. All services emit structured logs with trace IDs; critical user journeys are instrumented with metrics and alerts. Red‑Green‑Refactor is the norm.

### VI. Progressive Disclosure & Radical Simplicity

Reduce cognitive load. One primary action per screen, sensible defaults, and tiny steps over long forms. Empty/blank states teach by example with preloaded content. Tours (if used) spur activity, not point at buttons.

### VII. Transparent Personalization

Recommendations (rules + embeddings) must be explainable, adjustable, and pausable. Parents can view/edit preference tags, opt in/out of data use, and override recommendations. Human‑in‑the‑loop review is available for sensitive content.

### VIII. Ethical Monetization & Trust

We use a clear value ladder (free → basic → premium) without dark patterns. Prices are visible, cancellations are self‑service, and reminders are respectful. We explore scholarships and community‑sponsored access for families in need.

### IX. Experimentation with Rigor

A/B tests require preregistered success metrics, exposure caps, and guardrails. No experiments are run on minors without caregiver consent. Feature flags back every launch; kill‑switches and rollbacks are standard.

### X. Evidence‑Led Content

Parenting guidance cites credible sources where relevant, discloses uncertainty, and avoids absolutist language. Content surfaces disclaimers (“not medical/legal advice”) and pathways to professional help when appropriate.

### XI. Performance, Reliability & Offline Resilience

Targets: p95 LCP &lt; 2.0s on 3G‑like conditions for public pages; p95 TTI &lt; 3.5s. Core experiences are offline‑capable with background sync. We define SLOs per service with error budgets that drive release pacing.

### XII. Versioning & Breaking Changes

Follow **MAJOR.MINOR.PATCH**. Deprecations include timelines, migration notes, and compatibility shims where feasible. Changes to contracts require integration tests and staged rollouts behind flags.

### XIII. Governance Above All

This Constitution supersedes other practices. Changes require an amendment (see Governance) and migration plans. All PRs and product reviews must explicitly attest to compliance or document approved exceptions.

---

## Product & Experience Standards

### Onboarding & First‑Run

- A single “Start Here” path: a short, emotionally intelligent quiz that seeds baseline tags.  
- Limbo states are minimized; each step makes useful progress.  
- A specific, relevant “Quick Win” concludes onboarding (downloadable/printable where helpful).  
- Social cues highlight highly valued behaviors (e.g., “Parents like you saved 20 minutes this week using Meal Planner”).  
- Completion earns a success state that explains “what just got better” and the next best step.

### Safety, Compliance & Ethics

- Data classification policy (Restricted/Confidential/Internal/Public). Children’s data defaults to **Restricted**.  
- Consent ledgering for sensitive processing; age‑gating for child surfaces.  
- Secure by default: encryption in transit/at rest, secrets management, key rotation, and least‑privilege RBAC.  
- Clear reporting channels for safety concerns and content takedowns with guaranteed response SLAs.  
- Trauma‑informed tone: warm, non‑judgmental, and choice‑preserving.

### Accessibility & Inclusion

- WCAG 2.2 AA target; inclusive language; support for color‑blind safe palettes and reduced motion.  
- Plain‑language summaries, captions/transcripts, and audio alternatives for long reads.  
- Localization framework ready (starting with US English) and culturally sensitive examples.  
- Low‑bandwidth modes for summaries, calm kits, and activity cards.

### Personalization Engine

- Hybrid rules + embeddings with explicit tag taxonomy (interests, goals, constraints, emotional state).  
- “Why am I seeing this?” on recommendation cards; one‑tap feedback to tune results.  
- Safe exploration mode for child surfaces; parent review queue for boundary topics.

### Community & Human Touch

- Optional, moderated community features; code of conduct; verified expert badges.  
- Blends AI recommendations with expert‑curated content and parent stories.  
- Clear escalation paths to human help when needed.

---

## Architecture & Data

### Profiles & Roles

- Objects: **Family**, **Caregiver**, **Child**, **Household**, **Trusted Adult**.  
- Roles: Owner, Caregiver, Viewer; per‑child permissions; multiple households supported.  
- Share codes/links with time‑boxed, scope‑limited access.

### Data Model & Telemetry

- Event taxonomy with stable names and typed payloads (PII redaction at source).  
- Metrics for Quick Wins, aha moment time, retention, and equity (distribution across demographics).  
- Data retention defaults conservative; deletion is real and cascades.

### Experimentation

- Central registry for experiments with hypothesis, metrics, exposure, and ethics checklist.  
- Holdouts for lifecycle messaging and recommendations.  
- Analysis templates and effect‑size reporting; results archived.

---

## Delivery Workflow & Quality Gates

### Branching & Releases

- Trunk‑based development with short‑lived branches.  
- CI checks: type/lint, unit, contract, accessibility, and performance budgets.  
- Canary deploys, error‑budget‑driven release trains, and instant rollback.

### Testing Strategy

- **Unit** (all libraries), **Contract** (CLI & service edges), **Integration** (shared schemas), **E2E** (critical user journeys), **Synthetic Personas** (equity, accessibility, and emotional friction checks).  
- Test data never includes real child PII.

### Observability & Runbooks

- Structured logs with trace IDs; golden signals and SLO dashboards per service.  
- On‑call severity matrix, paging policy, and incident runbooks.  
- Blameless postmortems with public‑facing summaries when incidents affect users.

---

## Growth, Messaging & Content Quality

### Ethical Growth

- Lead magnets (e.g., book summaries, calm kits) with double opt‑in; frequency caps; one‑click unsubscribe.  
- Lifecycle nudges act as catalysts for return visits, not pressure.  
- Funnels map to real goals (connection, calm, clarity), not vanity metrics.

### Content Review

- Source transparency on evidence‑based pieces; editorial calendar includes expert review and parent feedback loops.  
- Style: warm, playful, and respectful; avoids shame or absolutist claims.  
- Clear “paths to action” at the end of each resource.

---

## Governance

1. **Scope & Supremacy**  
   This Constitution applies to all product, content, engineering, data, and growth work. In conflicts, this document wins unless an approved amendment states otherwise.

2. **Compliance Checklist**  
   Each PR/release includes an attestation covering: Quick Win impact, safety/privacy, accessibility, performance budgets, observability, and experiment guardrails.

3. **Exception Process**  
   Temporary exceptions require: (a) clear rationale, (b) mitigations, (c) time limit, (d) responsible owner. All exceptions are logged and reviewed monthly.

4. **Amendments**  
   Proposals include: problem statement, trade‑off analysis, user impact (esp. children), migration plan, and rollback strategy. Approval requires a cross‑functional review (Product, Eng, Design, Data, Content, Safety). Ratified amendments update versioning and changelog.

5. **Review Cadence**  
   Quarterly Constitutional Review to evaluate metrics (Quick Win success rate, SLOs, accessibility audits, experiment ethics). Outcomes drive roadmap adjustments.

---

**Version**: 1.0.0 | **Ratified**: 2025‑09‑03 | **Last Amended**: 2025‑09‑03
