/**
 * Simplified Navigation Component
 * Shows different navigation based on authentication status
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { publicNavigationItems, authenticatedNavigationItems } from '@/app/lib/content/homepage';

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav 
      className="bg-white border-b border-gray-200 sticky top-0 z-40"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Public Navigation (when signed out) */}
            <SignedOut>
              <ul className="flex items-center gap-6" role="list">
                {publicNavigationItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        'text-gray-600 hover:text-purple-600 transition-colors duration-200',
                        'font-medium px-3 py-2 rounded-md hover:bg-purple-50',
                        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                      )}
                      {...(item.isExternal && {
                        target: '_blank',
                        rel: 'noopener noreferrer'
                      })}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <SignInButton>
                <Button variant="default" size="sm">
                  Login
                </Button>
              </SignInButton>
            </SignedOut>

            {/* Authenticated Navigation (when signed in) */}
            <SignedIn>
              <ul className="flex items-center gap-6" role="list">
                {authenticatedNavigationItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        'text-gray-600 hover:text-purple-600 transition-colors duration-200',
                        'font-medium px-3 py-2 rounded-md hover:bg-purple-50',
                        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <UserButton />
            </SignedIn>
          </div>
          
          {/* Mobile menu button */}
          <button
            type="button"
            className={cn(
              'md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
            )}
            onClick={toggleMobileMenu}
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
              {/* Public Navigation (when signed out) */}
              <SignedOut>
                <ul className="space-y-2" role="list">
                  {publicNavigationItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={cn(
                          'block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50',
                          'rounded-md transition-colors duration-200 font-medium',
                          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                        )}
                        onClick={closeMobileMenu}
                        {...(item.isExternal && {
                          target: '_blank',
                          rel: 'noopener noreferrer'
                        })}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t border-gray-200">
                  <SignInButton>
                    <Button variant="default" className="w-full">
                      Login
                    </Button>
                  </SignInButton>
                </div>
              </SignedOut>

              {/* Authenticated Navigation (when signed in) */}
              <SignedIn>
                <ul className="space-y-2" role="list">
                  {authenticatedNavigationItems.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={cn(
                          'block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50',
                          'rounded-md transition-colors duration-200 font-medium',
                          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                        )}
                        onClick={closeMobileMenu}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t border-gray-200 flex justify-center">
                  <UserButton />
                </div>
              </SignedIn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
