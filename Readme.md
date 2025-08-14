Initialize a new Next.js (App Router) TypeScript project named "familying" with Tailwind CSS. Then add shadcn/ui and set up a base UI kit.

Tasks:
1) npx create-next-app@latest familying --typescript --eslint --tailwind --src-dir --app --import-alias "@/*"
2) cd familying
3) Install deps: 
   - clerk: npm i @clerk/nextjs
   - supabase: npm i @supabase/supabase-js
   - zod, lucide-react, class-variance-authority, tailwind-merge: npm i zod lucide-react class-variance-authority tailwind-merge
4) Add shadcn/ui: npx shadcn@latest init
   - Configure components dir: src/components/ui
   - Generate: button, input, label, card, badge, textarea, sheet, dropdown-menu, avatar, tabs, separator, dialog, tooltip, alert, toast
5) Create a clean base layout (app/layout.tsx) with Tailwind container, system font, and a top-level <Toaster /> slot for toasts.

Acceptance:
- App runs with `npm run dev`
- Tailwind classes apply
- shadcn components compile with no TS errors
