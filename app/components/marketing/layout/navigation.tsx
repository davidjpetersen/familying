/**
 * Navigation Component with heart-icon logo
 * Constitutional compliance: Accessible navigation, clear hierarchy
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import { cn } from '../../../../lib/utils';
import { CTAButton } from '../ui/cta-button';
import { navigationItems } from '../../../lib/content/homepage';
import { ButtonVariant, ButtonSize } from '../../../lib/types/marketing';

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const primaryCtaButton = {
    id: 'nav-cta',
    text: 'Take Quiz',
    href: '/quiz',
    variant: ButtonVariant.PRIMARY,
    size: ButtonSize.SM,
    ariaLabel: 'Start the family quiz',
    trackingEvent: 'nav_cta_click',
    isDisabled: false
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
            <ul className="flex items-center gap-6" role="list">
              {navigationItems.map((item) => (
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
              {/* Additional navigation items from original navbar */}
              <li>
                <Link
                  href="/recipes"
                  className={cn(
                    'text-gray-600 hover:text-purple-600 transition-colors duration-200',
                    'font-medium px-3 py-2 rounded-md hover:bg-purple-50',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                  )}
                >
                  Browse Recipes
                </Link>
              </li>
              <li>
                <Link
                  href="/subscription"
                  className={cn(
                    'text-gray-600 hover:text-purple-600 transition-colors duration-200',
                    'font-medium px-3 py-2 rounded-md hover:bg-purple-50',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                  )}
                >
                  Subscriptions
                </Link>
              </li>
              <li>
                <Link
                  href="/my-cookbook"
                  className={cn(
                    'text-gray-600 hover:text-purple-600 transition-colors duration-200',
                    'font-medium px-3 py-2 rounded-md hover:bg-purple-50',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                  )}
                >
                  My Cookbook
                </Link>
              </li>
            </ul>
            
            {/* Auth Section */}
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton>
                  <CTAButton button={primaryCtaButton} />
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
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
              <ul className="space-y-2" role="list">
                {navigationItems.map((item) => (
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
                {/* Additional navigation items from original navbar */}
                <li>
                  <Link
                    href="/recipes"
                    className={cn(
                      'block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50',
                      'rounded-md transition-colors duration-200 font-medium',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                    )}
                    onClick={closeMobileMenu}
                  >
                    Browse Recipes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/subscription"
                    className={cn(
                      'block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50',
                      'rounded-md transition-colors duration-200 font-medium',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                    )}
                    onClick={closeMobileMenu}
                  >
                    Subscriptions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-cookbook"
                    className={cn(
                      'block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50',
                      'rounded-md transition-colors duration-200 font-medium',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
                    )}
                    onClick={closeMobileMenu}
                  >
                    My Cookbook
                  </Link>
                </li>
              </ul>
              
              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <SignedOut>
                  <SignInButton>
                    <CTAButton 
                      button={{
                        ...primaryCtaButton,
                        size: ButtonSize.MD
                      }}
                      className="w-full"
                    />
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <div className="flex justify-center">
                    <UserButton />
                  </div>
                </SignedIn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
