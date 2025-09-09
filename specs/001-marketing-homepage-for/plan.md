# Implementation Plan: Marketing Homepage for Familying.org

**Branch**: `001-marketing-homepage-for` | **Date**: 2025-09-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/davidpetersen/Desktop/Projects/familying/specs/001-marketing-homepage-for/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → SUCCESS: Feature spec loaded
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type: web (frontend marketing page)
   → Set Structure Decision: Option 2 (Web application)
3. Evaluate Constitution Check section below
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
6. Re-evaluate Constitution Check section
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Create a marketing homepage for Familying.org that converts overwhelmed parents into engaged quiz-takers. The page emphasizes personalization, quick wins, and inclusive family messaging through a multi-section layout including hero, process explanation, testimonials, resource previews, differentiation, social proof, and strong calls-to-action.

## Technical Context
**Language/Version**: TypeScript 5.x, Next.js 15.x  
**Primary Dependencies**: React 19, Tailwind CSS 4, Radix UI, Clerk (auth), Lucide React (icons)  
**Storage**: Static content (no database for marketing page)  
**Testing**: Jest, React Testing Library, Playwright (E2E)  
**Target Platform**: Modern web browsers, mobile-responsive  
**Project Type**: web (frontend marketing page within existing Next.js app)  
**Performance Goals**: Core Web Vitals compliance (LCP <2.0s, CLS <0.1), constitutional p95 LCP <2.0s on 3G  
**Constraints**: WCAG 2.2 AA accessibility, mobile-first responsive, inclusive messaging  
**Scale/Scope**: Single marketing page with 8 sections, ~10 components

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (marketing page within existing Next.js app)
- Using framework directly? Yes (Next.js/React components)
- Single data model? Yes (static content structure)
- Avoiding patterns? Yes (no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? Marketing page sections as reusable components
- Libraries listed: 
  - `homepage-sections`: Hero, HowItWorks, Testimonials, etc. components
  - `marketing-ui`: Shared CTA buttons, responsive layouts
- CLI per library: Component library with Storybook for development
- Library docs: Component API documentation in llms.txt format

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes, tests written before components
- Git commits show tests before implementation? Yes, commit structure enforced
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual Next.js routing, Clerk auth integration)
- Integration tests for: Component integration, responsive behavior, accessibility
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes (user interactions, performance metrics)
- Frontend logs → backend? Not applicable for static marketing page
- Error context sufficient? Yes (error boundaries, fallback UI)

**Versioning**:
- Version number assigned? 1.0.0 (new marketing homepage)
- BUILD increments on every change? Yes
- Breaking changes handled? Not applicable for initial implementation

## Project Structure

### Documentation (this feature)
```
specs/001-marketing-homepage-for/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (marketing page within existing Next.js structure)
app/
├── page.tsx             # New marketing homepage (replaces existing)
├── components/
│   ├── marketing/       # New marketing-specific components
│   │   ├── hero/
│   │   ├── how-it-works/
│   │   ├── testimonials/
│   │   ├── free-preview/
│   │   ├── differentiation/
│   │   ├── social-proof/
│   │   └── final-cta/
│   └── ui/              # Existing shared UI components
└── lib/
    ├── content/         # Static content and copy
    └── utils/           # Marketing-specific utilities

tests/
├── e2e/                 # Playwright tests for user journeys
├── integration/         # Component integration tests
└── unit/                # Individual component tests
```

**Structure Decision**: Option 2 (Web application) - Marketing page within existing Next.js app structure

## Phase 0: Outline & Research

### Research Tasks Identified:
1. **Animation/motion effects specification** (from NEEDS CLARIFICATION in spec)
   - Research: Modern web animation libraries compatible with React/Next.js
   - Focus: Accessibility-compliant animations, reduced motion support

2. **Image strategy for testimonials** (from NEEDS CLARIFICATION in spec)  
   - Research: Placeholder vs. real photos approach for testimonials
   - Focus: Privacy, authenticity, and design consistency

3. **Social proof data strategy** (from NEEDS CLARIFICATION in spec)
   - Research: Mock vs. real social proof elements implementation
   - Focus: Credibility, legal compliance, and maintenance

4. **Performance optimization patterns**
   - Research: Next.js 15 performance best practices for marketing pages
   - Focus: Image optimization, Core Web Vitals, mobile performance

5. **Accessibility compliance**
   - Research: WCAG 2.2 AA implementation with Tailwind CSS and Radix UI
   - Focus: Screen readers, keyboard navigation, color contrast

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

### Entity Extraction for data-model.md:
- **MarketingContent**: Headlines, copy, testimonials, resource previews
- **NavigationItem**: Menu links with availability status
- **CTAButton**: Call-to-action elements with tracking
- **TestimonialItem**: User feedback with attribution
- **ResourcePreview**: Sample downloadable materials
- **SocialProofElement**: Logos, ratings, statistics

### API Contracts Generation:
Since this is a static marketing page, contracts will focus on:
- Component prop interfaces (TypeScript)
- Content structure schemas
- Analytics event schemas
- Performance monitoring contracts

### Test Scenarios from User Stories:
1. **Homepage Load Test**: Visitor sees complete page with all sections
2. **CTA Flow Test**: Quiz button redirects appropriately  
3. **Mobile Responsive Test**: All sections work on mobile
4. **Accessibility Test**: Screen reader and keyboard navigation
5. **Performance Test**: Page meets Core Web Vitals targets

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each component → component test task + implementation task [P]
- Each section → integration test task [P]
- Performance and accessibility validation tasks
- Content integration and review tasks

**Ordering Strategy**:
- TDD order: Tests before implementation for each component
- Dependency order: Base UI components → Section components → Page assembly
- Parallel execution: Independent components marked [P]
- Critical path: Hero section → CTA buttons → Other sections

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations identified - all requirements can be met within established patterns*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*