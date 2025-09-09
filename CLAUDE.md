# Familying.org Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-09

## Active Technologies
- TypeScript 5.x, Next.js 15.x, React 19 (001-marketing-homepage-for)
- Tailwind CSS 4, Radix UI, Clerk (auth), Lucide React (001-marketing-homepage-for)
- Framer Motion v11 for animations (001-marketing-homepage-for)

## Project Structure
```
app/
├── page.tsx             # Marketing homepage (001)
├── components/
│   ├── marketing/       # Marketing-specific components (001)
│   └── ui/              # Existing shared UI components
└── lib/
    ├── content/         # Static content and copy (001)
    └── utils/           # Marketing utilities (001)

tests/
├── e2e/                 # Playwright tests (001)
├── integration/         # Component integration tests (001)  
└── unit/                # Individual component tests (001)
```

## Commands
```bash
# Development
pnpm dev --turbopack

# Testing  
pnpm test            # Jest unit/integration tests
pnpm test:e2e        # Playwright E2E tests
pnpm test:a11y       # Accessibility testing

# Building
pnpm build
pnpm start

# Linting
pnpm lint
pnpm typecheck
```

## Code Style
- TypeScript strict mode enabled
- Test-driven development (TDD) required - tests before implementation
- Constitutional compliance: Privacy-first, accessibility-aware, performance-optimized
- WCAG 2.2 AA accessibility standards
- Performance targets: p95 LCP <2.0s on 3G conditions

## Constitutional Requirements (001-marketing-homepage-for)
- **Privacy**: No real user photos, AI-generated avatars only
- **Accessibility**: Reduced motion support, screen reader compatibility
- **Performance**: Core Web Vitals compliance, image optimization
- **Inclusivity**: Diverse family representation, non-judgmental language
- **Ethics**: Transparent social proof, no dark patterns

## Recent Changes
- 001-marketing-homepage-for: Marketing homepage with 8 sections, privacy-compliant testimonials, performance-optimized animations

<!-- MANUAL ADDITIONS START -->
<!-- Add manual documentation here -->
<!-- MANUAL ADDITIONS END -->