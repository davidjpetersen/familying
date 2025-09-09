# Familying.org

Familying.org is a modern web application designed to help families organize, share, and manage recipes, meal plans, and more. Built with Next.js, Supabase, and a clean, responsive UI, Familying.org makes it easy to collaborate and keep your family’s favorite meals in one place.

## Features

- **User Authentication**: Secure sign-up and sign-in.
- **Recipe Management**: Add, edit, and browse recipes.
- **Comments**: Share feedback and tips on recipes.
- **Personal Cookbook**: Save and organize your favorite recipes.
- **Subscription Support**: Manage access and premium features.
- **Responsive Design**: Works seamlessly on all devices.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (recommended)

### Installation

Clone the repository:

```bash
git clone https://github.com/davidjpetersen/familying.git
cd familying
```

Install dependencies:

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If using authentication or subscriptions, add the relevant keys as needed.

### Running the App

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

## Database

The example Supabase schema is provided in `supabase_schema.sql`.

## License

MIT
