# Familying - Family Management Platform

A modern family management platform built with Next.js and Clerk authentication.

## Features

- 🔐 Secure authentication with Clerk
- 📱 Responsive design with Tailwind CSS
- 🏠 Marketing landing page
- 📊 Protected dashboard
- 👥 User management
- 🛡️ Route protection with middleware

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- A Clerk account (free tier available)

### Installation

1. Clone the repository and install dependencies:
```bash
pnpm install
```

2. Set up Clerk authentication:
   - Create a free account at [clerk.com](https://clerk.com)
   - Create a new application in your Clerk dashboard
   - Copy your publishable key and secret key

3. Configure environment variables:
   - Copy `.env.local` and update with your Clerk keys:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Optional: Customize sign-in/sign-up URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Protected dashboard page
│   │   └── page.tsx
│   ├── sign-in/           # Sign-in page with Clerk
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   ├── sign-up/           # Sign-up page with Clerk
│   │   └── [[...sign-up]]/
│   │       └── page.tsx
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with ClerkProvider
│   └── page.tsx           # Marketing landing page
├── middleware.ts          # Route protection middleware
└── ...
```

## Authentication Flow

1. **Public Routes**: `/` (landing page), `/sign-in`, `/sign-up`
2. **Protected Routes**: `/dashboard/*` - requires authentication
3. **Middleware**: Automatically redirects unauthenticated users to sign-in
4. **Post-Auth**: Users are redirected to `/dashboard` after signing in

## Technologies Used

- **Framework**: Next.js 15 with App Router
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Package Manager**: pnpm

## Deployment

The app is ready to deploy to Vercel, Netlify, or any platform that supports Next.js:

1. Build the application:
```bash
pnpm build
```

2. Set up environment variables in your deployment platform
3. Deploy using your preferred method

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
