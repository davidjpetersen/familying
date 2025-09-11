/**
 * Organization-Aware Navigation Component
 * Shows different navigation based on authentication and organization status
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { SignedOut, SignInButton, SignedIn, UserButton, useClerk } from "@clerk/nextjs";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useOrganizationNavigation } from '../../../lib/hooks/useOrganizationNavigation';
import { Settings } from 'lucide-react';

const Logo = () => {
  const { hasOrganization, isLoaded } = useOrganizationNavigation();
  
  return (
    <>
      <SignedOut>
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
          aria-label="Familying.org homepage"
        >
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg" aria-hidden="true">♥</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Familying.org</span>
        </Link>
      </SignedOut>
      <SignedIn>
        <Link
          href={isLoaded && hasOrganization ? "/dashboard" : "/"}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
          aria-label={isLoaded && hasOrganization ? "Familying.org dashboard" : "Familying.org homepage"}
        >
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg" aria-hidden="true">♥</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Familying.org</span>
        </Link>
      </SignedIn>
    </>
  );
};

const linkClass = cn(
  'text-gray-600 hover:text-purple-600 transition-colors duration-200',
  'font-medium px-3 py-2 rounded-md hover:bg-purple-50',
  'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
);

const mobileLinkClass = cn(
  'block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50',
  'rounded-md transition-colors duration-200 font-medium',
  'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
);

const CustomUserButton = () => {
  const { openOrganizationProfile } = useClerk();
  const { shouldShowFamilySettings } = useOrganizationNavigation();

  return (
    <UserButton>
      {shouldShowFamilySettings && (
        <UserButton.MenuItems>
          <UserButton.Action
            label="Family Settings"
            labelIcon={<Settings className="w-4 h-4" />}
            onClick={() => openOrganizationProfile()}
          />
        </UserButton.MenuItems>
      )}
    </UserButton>
  );
};

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { hasOrganization, shouldShowCreateFamily, currentOrganization, isLoaded } = useOrganizationNavigation();

  return (
    <nav 
      className="bg-white border-b border-gray-200 sticky top-0 z-40"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <SignedOut>
              <Link href="/subscription" className={linkClass}>
                Subscribe
              </Link>
              <SignInButton>
                <Button variant="default" size="sm">
                  Login
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              {isLoaded && (
                <>
                  {hasOrganization ? (
                    <>
                      <Link href="/dashboard" className={linkClass}>
                        Dashboard
                      </Link>
                      {currentOrganization && (
                        <div className="text-sm text-gray-500 px-3 py-2">
                          {currentOrganization.name}
                        </div>
                      )}
                    </>
                  ) : shouldShowCreateFamily ? (
                    <Link href="/create-family" className={cn(linkClass, "bg-purple-100 text-purple-700 hover:bg-purple-200")}>
                      Create Family
                    </Link>
                  ) : null}
                </>
              )}
              <CustomUserButton />
            </SignedIn>
          </div>
          
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            className="md:hidden bg-white border-t border-gray-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 py-4 space-y-4">
              <SignedOut>
                <Link href="/subscription" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                  Subscribe
                </Link>
                <div className="pt-4 border-t border-gray-200">
                  <SignInButton>
                    <Button variant="default" className="w-full">
                      Login
                    </Button>
                  </SignInButton>
                </div>
              </SignedOut>

              <SignedIn>
                {isLoaded && (
                  <>
                    {hasOrganization ? (
                      <>
                        <Link href="/dashboard" className={mobileLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                          Dashboard
                        </Link>
                        {currentOrganization && (
                          <div className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-md bg-gray-50">
                            {currentOrganization.name}
                          </div>
                        )}
                      </>
                    ) : shouldShowCreateFamily ? (
                      <Link 
                        href="/create-family" 
                        className={cn(mobileLinkClass, "bg-purple-100 text-purple-700 hover:bg-purple-200")} 
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Create Family
                      </Link>
                    ) : null}
                  </>
                )}
                <div className="pt-4 border-t border-gray-200 flex justify-center">
                  <CustomUserButton />
                </div>
              </SignedIn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}