# Tasks: Marketing Homepage for Familying.org

**Input**: Design documents from `/Users/davidpetersen/Desktop/Projects/familying/specs/001-marketing-homepage-for/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript 5.x, Next.js 15.x, React 19, Tailwind CSS 4, Framer Motion v11
   → Structure: Web app - marketing page within existing Next.js structure
2. Load optional design documents: ✓
   → data-model.md: 9 entities → model tasks
   → contracts/: types.ts, components.ts → contract test tasks
   → research.md: Framer Motion, AI avatars, transparent social proof → setup tasks
3. Generate tasks by category: ✓
4. Apply TDD rules: Tests before implementation ✓
5. Number tasks sequentially (T001, T002...) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
**Next.js App Structure** (per plan.md):
- Components: `app/components/marketing/`
- Content: `app/lib/content/`
- Tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Types: `app/lib/types/` (generated from contracts/)

## Phase 3.1: Setup & Dependencies

- [ ] **T001** Create project structure for marketing homepage per implementation plan
- [ ] **T002** Install Next.js marketing page dependencies (framer-motion, additional icons)
- [ ] **T003** [P] Configure TypeScript types from contracts/types.ts → `app/lib/types/marketing.ts`
- [ ] **T004** [P] Setup Framer Motion with accessibility configuration in `app/lib/utils/animations.ts`
- [ ] **T005** [P] Create marketing content structure in `app/lib/content/homepage.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Component Contract Tests
- [ ] **T006** [P] Contract test for CTAButton component in `tests/unit/components/cta-button.test.tsx`
- [ ] **T007** [P] Contract test for TestimonialCard component in `tests/unit/components/testimonial-card.test.tsx`
- [ ] **T008** [P] Contract test for ResourceCard component in `tests/unit/components/resource-card.test.tsx`
- [ ] **T009** [P] Contract test for ProcessStep component in `tests/unit/components/process-step.test.tsx`
- [ ] **T010** [P] Contract test for Avatar component in `tests/unit/components/avatar.test.tsx`

### Section Integration Tests
- [ ] **T011** [P] Integration test for HeroSection in `tests/integration/hero-section.test.tsx`
- [ ] **T012** [P] Integration test for HowItWorksSection in `tests/integration/how-it-works-section.test.tsx`
- [ ] **T013** [P] Integration test for TestimonialsSection in `tests/integration/testimonials-section.test.tsx`
- [ ] **T014** [P] Integration test for FreePreviewSection in `tests/integration/free-preview-section.test.tsx`
- [ ] **T015** [P] Integration test for DifferentiationSection in `tests/integration/differentiation-section.test.tsx`
- [ ] **T016** [P] Integration test for SocialProofSection in `tests/integration/social-proof-section.test.tsx`
- [ ] **T017** [P] Integration test for FinalCtaSection in `tests/integration/final-cta-section.test.tsx`

### Page-Level Tests
- [ ] **T018** Full homepage load test in `tests/integration/marketing-page.test.tsx`
- [ ] **T019** Mobile responsive test in `tests/integration/responsive-design.test.tsx`
- [ ] **T020** Accessibility compliance test in `tests/integration/accessibility.test.tsx`

## Phase 3.3: Core UI Components (ONLY after tests are failing)

### Base Components
- [ ] **T021** [P] CTAButton component in `app/components/marketing/ui/cta-button.tsx`
- [ ] **T022** [P] Avatar component with AI-generated image support in `app/components/marketing/ui/avatar.tsx`
- [ ] **T023** [P] TestimonialCard component in `app/components/marketing/ui/testimonial-card.tsx`
- [ ] **T024** [P] ResourceCard component in `app/components/marketing/ui/resource-card.tsx`
- [ ] **T025** [P] ProcessStep component with Framer Motion in `app/components/marketing/ui/process-step.tsx`

### Layout Components
- [ ] **T026** [P] MarketingLayout wrapper in `app/components/marketing/layout/marketing-layout.tsx`
- [ ] **T027** [P] Navigation component with heart-icon logo in `app/components/marketing/layout/navigation.tsx`
- [ ] **T028** [P] ResponsiveImage component with Next.js optimization in `app/components/marketing/ui/responsive-image.tsx`

## Phase 3.4: Section Components

- [ ] **T029** HeroSection with mobile mockup in `app/components/marketing/sections/hero-section.tsx`
- [ ] **T030** HowItWorksSection with 3-step animation in `app/components/marketing/sections/how-it-works-section.tsx`
- [ ] **T031** TestimonialsSection with carousel in `app/components/marketing/sections/testimonials-section.tsx`
- [ ] **T032** FreePreviewSection with resource grid in `app/components/marketing/sections/free-preview-section.tsx`
- [ ] **T033** DifferentiationSection with comparison table in `app/components/marketing/sections/differentiation-section.tsx`
- [ ] **T034** SocialProofSection with transparent metrics in `app/components/marketing/sections/social-proof-section.tsx`
- [ ] **T035** FinalCtaSection with prominent button in `app/components/marketing/sections/final-cta-section.tsx`

## Phase 3.5: Content & Data Integration

- [ ] **T036** [P] Homepage content data with constitutional compliance in `app/lib/content/homepage-data.ts`
- [ ] **T037** [P] Testimonial data with AI-generated avatars in `app/lib/content/testimonials-data.ts`
- [ ] **T038** [P] Resource preview data in `app/lib/content/resources-data.ts`
- [ ] **T039** [P] Social proof data with actual metrics in `app/lib/content/social-proof-data.ts`

## Phase 3.6: Page Assembly & Animation

- [ ] **T040** Marketing homepage assembly in `app/page.tsx`
- [ ] **T041** Animation utilities with reduced motion support in `app/lib/utils/animation-helpers.ts`
- [ ] **T042** Error boundaries for marketing components in `app/components/marketing/error-boundary.tsx`
- [ ] **T043** Loading states for dynamic content in `app/components/marketing/ui/loading-states.tsx`

## Phase 3.7: Performance & Accessibility

- [ ] **T044** [P] Image optimization for avatars and mockups in `app/lib/utils/image-optimization.ts`
- [ ] **T045** [P] Web Vitals monitoring in `app/lib/utils/performance-monitoring.ts`
- [ ] **T046** [P] Accessibility utilities (focus management, ARIA) in `app/lib/utils/accessibility.ts`
- [ ] **T047** SEO metadata implementation in `app/lib/utils/seo-helpers.ts`

## Phase 3.8: E2E Testing & Validation

- [ ] **T048** [P] Playwright E2E test for complete user journey in `tests/e2e/homepage-journey.spec.ts`
- [ ] **T049** [P] Performance testing with Lighthouse in `tests/e2e/performance.spec.ts`
- [ ] **T050** [P] Mobile device testing in `tests/e2e/mobile-experience.spec.ts`
- [ ] **T051** [P] Accessibility testing with axe-core in `tests/e2e/accessibility.spec.ts`

## Phase 3.9: Polish & Documentation

- [ ] **T052** [P] Storybook stories for all components in `stories/marketing/`
- [ ] **T053** [P] Component documentation in `app/components/marketing/README.md`
- [ ] **T054** [P] Performance optimization final review
- [ ] **T055** [P] Constitutional compliance audit (privacy, inclusivity, accessibility)
- [ ] **T056** Run quickstart.md validation checklist

## Dependencies

**Setup Dependencies:**
- T001 → T002 → T003,T004,T005

**Test Dependencies (MUST COMPLETE BEFORE IMPLEMENTATION):**
- T006-T020 MUST ALL PASS (fail first) before any T021-T055

**Component Dependencies:**
- T021-T025 (UI components) before T026-T028 (layout)  
- T026-T028 (layout) before T029-T035 (sections)
- T036-T039 (content) before T040 (page assembly)
- T029-T035 (sections) before T040 (page assembly)

**Integration Dependencies:**
- T040 (page) before T041-T043 (animation/error handling)
- T044-T047 (performance/a11y) can run parallel with T048-T051 (E2E)
- T048-T051 (E2E tests) before T052-T056 (polish)

## Parallel Execution Examples

### Phase 3.2 - All Tests (T006-T020)
```bash
# Launch all contract tests together (different files):
Task: "Contract test for CTAButton component in tests/unit/components/cta-button.test.tsx"
Task: "Contract test for TestimonialCard component in tests/unit/components/testimonial-card.test.tsx"  
Task: "Contract test for ResourceCard component in tests/unit/components/resource-card.test.tsx"
Task: "Contract test for ProcessStep component in tests/unit/components/process-step.test.tsx"
Task: "Contract test for Avatar component in tests/unit/components/avatar.test.tsx"

# Launch all integration tests together:
Task: "Integration test for HeroSection in tests/integration/hero-section.test.tsx"
Task: "Integration test for HowItWorksSection in tests/integration/how-it-works-section.test.tsx"
# ... (all integration tests)
```

### Phase 3.3 - UI Components (T021-T025)
```bash
# All base UI components (independent files):
Task: "CTAButton component in app/components/marketing/ui/cta-button.tsx"
Task: "Avatar component with AI-generated image support in app/components/marketing/ui/avatar.tsx"
Task: "TestimonialCard component in app/components/marketing/ui/testimonial-card.tsx"
Task: "ResourceCard component in app/components/marketing/ui/resource-card.tsx"
Task: "ProcessStep component with Framer Motion in app/components/marketing/ui/process-step.tsx"
```

### Phase 3.5 - Content Data (T036-T039)
```bash
# All content files (independent):
Task: "Homepage content data with constitutional compliance in app/lib/content/homepage-data.ts"
Task: "Testimonial data with AI-generated avatars in app/lib/content/testimonials-data.ts"
Task: "Resource preview data in app/lib/content/resources-data.ts"
Task: "Social proof data with actual metrics in app/lib/content/social-proof-data.ts"
```

## Constitutional Compliance Checkpoints

**T003-T005**: Ensure type safety and accessibility from contracts
**T036-T039**: Verify privacy compliance (no child PII, AI avatars only)
**T044-T047**: Performance targets (p95 LCP <2.0s), WCAG 2.2 AA compliance
**T055**: Final constitutional audit before completion

## Task Validation Checklist

- [x] All contracts have corresponding tests (T006-T010)
- [x] All entities have model/component tasks (T021-T025, T036-T039)
- [x] All tests come before implementation (T006-T020 before T021+)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Constitutional requirements embedded in relevant tasks

## Success Criteria

✅ **56 total tasks** covering complete marketing homepage implementation
✅ **TDD compliance** with tests written first and failing before implementation  
✅ **Constitutional compliance** with privacy, accessibility, and performance requirements
✅ **Parallel execution** optimized with 28 [P] tasks for independent development
✅ **Clear dependencies** with proper ordering for successful completion

This task list provides a complete, executable roadmap for implementing the Familying.org marketing homepage while maintaining strict adherence to constitutional principles and modern development best practices.