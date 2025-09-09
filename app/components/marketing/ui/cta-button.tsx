/**
 * CTAButton Component
 * Constitutional compliance: Accessibility-first, performance-optimized
 */

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { CTAButtonProps } from '../../../lib/types/marketing';
import { ButtonVariant, ButtonSize } from '../../../lib/types/marketing';

const buttonVariants = {
  [ButtonVariant.PRIMARY]: 'bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-600',
  [ButtonVariant.SECONDARY]: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-gray-100',
  [ButtonVariant.OUTLINE]: 'bg-transparent hover:bg-purple-50 text-purple-600 border-2 border-purple-600'
};

const buttonSizes = {
  [ButtonSize.SM]: 'px-4 py-2 text-sm',
  [ButtonSize.MD]: 'px-6 py-3 text-base',
  [ButtonSize.LG]: 'px-8 py-4 text-lg'
};

// Check if user prefers reduced motion
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export function CTAButton({ button, onClick, className }: CTAButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (button.isDisabled) {
      event.preventDefault();
      return;
    }

    // Call custom onClick if provided
    if (onClick) {
      onClick(event, button.trackingEvent);
    } else {
      // Navigate to href
      if (button.isExternal) {
        window.open(button.href, '_blank', 'noopener noreferrer');
      } else {
        window.location.href = button.href;
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (button.isDisabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const syntheticEvent = event as unknown as React.MouseEvent<HTMLButtonElement>;
      handleClick(syntheticEvent);
    }
  };

  const baseClasses = cn(
    // Base styles
    'font-semibold rounded-lg transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
    
    // Variant styles
    buttonVariants[button.variant],
    
    // Size styles
    buttonSizes[button.size],
    
    // Disabled styles
    button.isDisabled && 'opacity-50 cursor-not-allowed',
    
    // Animation styles (only if motion is not reduced)
    !prefersReducedMotion() && 'hover:transform hover:scale-105 active:scale-95',
    
    // Custom className
    className
  );

  const motionProps = prefersReducedMotion() 
    ? {} 
    : {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.2 }
      };

  const buttonContent = (
    <motion.button
      type="button"
      className={baseClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={button.isDisabled}
      aria-label={button.ariaLabel}
      {...(button.isExternal && {
        target: '_blank',
        rel: 'noopener noreferrer'
      })}
      {...motionProps}
    >
      {button.text}
    </motion.button>
  );

  // For internal links, wrap with Next.js Link
  if (!button.isExternal && !onClick) {
    return (
      <Link href={button.href}>
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
}
