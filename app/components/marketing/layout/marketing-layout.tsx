/**
 * MarketingLayout Component
 * Constitutional compliance: Accessibility-first structure, semantic HTML
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Navigation } from '@/components/layout/navigation';

interface MarketingLayoutProps {
  children: ReactNode;
  className?: string;
  showNavigation?: boolean;
}

export function MarketingLayout({ 
  children, 
  className,
  showNavigation = true 
}: MarketingLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-white', className)}>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-md"
      >
        Skip to main content
      </a>
      
      {/* Navigation */}
      {showNavigation && (
        <Navigation />
      )}
      
      {/* Main content */}
      <main 
        id="main-content"
        className="w-full py-0"
        role="main"
        aria-label="Marketing page content"
      >
        {children}
      </main>
      
      {/* Footer */}
      <footer 
        className="bg-gray-50 border-t border-gray-200 py-12"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">♥</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Familying.org</span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                Helping families create stronger connections through personalized strategies 
                for meal planning, bedtime routines, and quality time.
              </p>
              <p className="text-sm text-gray-500">
                © 2025 Familying.org. All rights reserved.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="/quiz" 
                    className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                  >
                    Take the Quiz
                  </a>
                </li>
                <li>
                  <a 
                    href="/resources" 
                    className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                  >
                    Free Resources
                  </a>
                </li>
                <li>
                  <a 
                    href="/about" 
                    className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a 
                    href="/contact" 
                    className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="/privacy" 
                    className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a 
                    href="/terms" 
                    className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a 
                    href="/accessibility" 
                    className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                  >
                    Accessibility
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
