import '@testing-library/jest-dom'
import React from 'react'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
  clerkClient: jest.fn(),
  UserButton: () => React.createElement('div', { 'data-testid': 'user-button' }, 'UserButton'),
  SignInButton: ({ children }: { children: React.ReactNode }) => 
    React.createElement('button', { 'data-testid': 'sign-in-button' }, children),
  SignUpButton: ({ children }: { children: React.ReactNode }) => 
    React.createElement('button', { 'data-testid': 'sign-up-button' }, children),
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
  clerkClient: jest.fn(),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
  supabaseAdmin: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      admin: {
        getUserById: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_test'
process.env.CLERK_SECRET_KEY = 'sk_test_test'

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
    }
  }
}
