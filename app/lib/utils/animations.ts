/**
 * Framer Motion Animation Utilities
 * Constitutional compliance: WCAG 2.2 AA accessibility with reduced motion support
 * Based on research findings: Framer Motion v11 with accessibility-first implementation
 */

import { Variants, Transition } from "framer-motion";

// Animation variants that respect reduced motion preferences
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

// Stagger animations for step processes
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Accessibility-compliant transitions
export const fastTransition: Transition = {
  duration: 0.01, // Near-instant for reduced motion
  ease: "linear"
};

export const standardTransition: Transition = {
  duration: 0.6,
  ease: "easeOut"
};

export const slowTransition: Transition = {
  duration: 0.8,
  ease: "easeOut"
};

// Viewport options for scroll-triggered animations
export const defaultViewport = {
  once: true,
  margin: "-100px",
  amount: 0.3 as const
};

// Hover animations for interactive elements
export const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2, ease: "easeOut" }
};

export const cardHover = {
  y: -4,
  scale: 1.02,
  transition: { duration: 0.3, ease: "easeOut" }
};

// Animation presets for different use cases
export const ANIMATION_PRESETS = {
  hero: {
    initial: "hidden",
    animate: "visible",
    variants: slideUp,
    transition: standardTransition
  },
  section: {
    initial: "hidden",
    whileInView: "visible",
    variants: fadeIn,
    viewport: defaultViewport,
    transition: standardTransition
  },
  step: {
    initial: "hidden",
    whileInView: "visible",
    variants: slideUp,
    viewport: defaultViewport,
    transition: standardTransition
  },
  testimonial: {
    initial: "hidden",
    whileInView: "visible",
    variants: scaleIn,
    viewport: defaultViewport,
    transition: standardTransition
  }
} as const;

// Utility function to get reduced motion-aware animation props
export const getAnimationProps = (
  presetName: keyof typeof ANIMATION_PRESETS,
  shouldReduceMotion: boolean
) => {
  const preset = ANIMATION_PRESETS[presetName];
  
  if (shouldReduceMotion) {
    return {
      ...preset,
      variants: fadeIn, // Simple fade for reduced motion
      transition: fastTransition
    };
  }
  
  return preset;
};

// Custom hook for consistent animation timing
export const useAnimationConfig = () => ({
  fadeIn,
  slideUp,
  slideInLeft,
  slideInRight,
  scaleIn,
  staggerContainer,
  staggerChild,
  defaultViewport,
  buttonHover,
  cardHover,
  ANIMATION_PRESETS,
  getAnimationProps
});