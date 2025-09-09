/**
 * Component API Contracts for Marketing Homepage
 * Test-driven development interfaces
 * All components must implement these contracts for type safety and testing
 */

import { ReactNode } from 'react';
import {
  HeroContent,
  HowItWorksContent,
  TestimonialContent,
  FreePreviewContent,
  DifferentiationContent,
  SocialProofContent,
  FinalCtaContent,
  CTAButton,
  TestimonialItem,
  ResourcePreview,
  TrackingEvent,
  AccessibilityAttributes
} from './types';

// Base component interface
export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
  children?: ReactNode;
}

// Layout components
export interface MarketingLayoutProps extends BaseComponentProps {
  navigation: NavigationProps;
  footer?: FooterProps;
  skipToContent?: boolean;
}

export interface NavigationProps extends BaseComponentProps {
  items: NavigationItem[];
  logo: LogoProps;
  ctaButton?: CTAButton;
  onItemClick?: (itemId: string, event: TrackingEvent) => void;
}

export interface LogoProps extends BaseComponentProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  href?: string;
  showHeartIcons?: boolean; // Playful heart icons over 'i's requirement
}

// Section components
export interface HeroSectionProps extends BaseComponentProps {
  content: HeroContent;
  onCtaClick?: (buttonId: string, event: TrackingEvent) => void;
  isLoading?: boolean;
}

export interface HowItWorksSectionProps extends BaseComponentProps {
  content: HowItWorksContent;
  animationsEnabled?: boolean;
  onStepView?: (stepNumber: number) => void;
}

export interface TestimonialsSectionProps extends BaseComponentProps {
  content: TestimonialContent;
  autoplay?: boolean;
  autoplayInterval?: number;
  onTestimonialView?: (testimonialId: string) => void;
}

export interface FreePreviewSectionProps extends BaseComponentProps {
  content: FreePreviewContent;
  onResourceClick?: (resourceId: string, event: TrackingEvent) => void;
  onCtaClick?: (event: TrackingEvent) => void;
}

export interface DifferentiationSectionProps extends BaseComponentProps {
  content: DifferentiationContent;
  animateOnView?: boolean;
}

export interface SocialProofSectionProps extends BaseComponentProps {
  content: SocialProofContent;
  onElementView?: (elementId: string) => void;
}

export interface FinalCtaSectionProps extends BaseComponentProps {
  content: FinalCtaContent;
  onCtaClick?: (event: TrackingEvent) => void;
  fullWidth?: boolean;
}

// UI components
export interface CTAButtonProps extends BaseComponentProps, AccessibilityAttributes {
  button: CTAButton;
  onClick?: (event: React.MouseEvent, trackingEvent: TrackingEvent) => void;
  isLoading?: boolean;
  loadingText?: string;
}

export interface TestimonialCardProps extends BaseComponentProps {
  testimonial: TestimonialItem;
  onView?: () => void;
  compact?: boolean;
}

export interface AvatarProps extends BaseComponentProps {
  avatar: Avatar;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: ReactNode;
  loading?: 'eager' | 'lazy';
}

export interface ResourceCardProps extends BaseComponentProps {
  resource: ResourcePreview;
  onDownload?: (resourceId: string) => void;
  onPreview?: (resourceId: string) => void;
  showDownloadButton?: boolean;
}

export interface ProcessStepProps extends BaseComponentProps {
  step: ProcessStep;
  isActive?: boolean;
  isCompleted?: boolean;
  animationDelay?: number;
  onStepClick?: (stepNumber: number) => void;
}

// Animation components
export interface AnimatedSectionProps extends BaseComponentProps {
  children: ReactNode;
  animation: 'fade-in' | 'slide-up' | 'slide-in-left' | 'slide-in-right' | 'scale-in';
  delay?: number;
  duration?: number;
  triggerOnce?: boolean;
  threshold?: number;
}

export interface MotionWrapperProps extends BaseComponentProps {
  children: ReactNode;
  initial?: object;
  animate?: object;
  transition?: object;
  whileInView?: object;
  viewport?: object;
}

// Utility components
export interface ResponsiveImageProps extends BaseComponentProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  loading?: 'eager' | 'lazy';
}

export interface IconProps extends BaseComponentProps {
  name: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  'aria-hidden'?: boolean;
}

export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children: ReactNode;
}

export interface SeparatorProps extends BaseComponentProps {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

// Error and loading states
export interface ErrorBoundaryProps extends BaseComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  'aria-label'?: string;
}

export interface SkeletonProps extends BaseComponentProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | false;
}

// Accessibility components
export interface SkipToContentProps extends BaseComponentProps {
  targetId: string;
  text?: string;
}

export interface ScreenReaderOnlyProps extends BaseComponentProps {
  children: ReactNode;
  asChild?: boolean;
}

export interface FocusTrapProps extends BaseComponentProps {
  children: ReactNode;
  active?: boolean;
  focusFirstOnMount?: boolean;
  returnFocusOnDeactivate?: boolean;
}

// Analytics and tracking
export interface TrackingProviderProps extends BaseComponentProps {
  children: ReactNode;
  trackingId?: string;
  enablePerformanceTracking?: boolean;
  enableErrorTracking?: boolean;
}

export interface AnalyticsEventProps {
  eventName: string;
  eventCategory: string;
  eventLabel?: string;
  eventValue?: number;
  customProperties?: Record<string, any>;
}

// Performance components
export interface LazyLoadProps extends BaseComponentProps {
  children: ReactNode;
  threshold?: number;
  rootMargin?: string;
  placeholder?: ReactNode;
  onIntersect?: () => void;
}

export interface WebVitalsProps {
  onLCP?: (metric: number) => void;
  onFID?: (metric: number) => void;
  onCLS?: (metric: number) => void;
  onTTFB?: (metric: number) => void;
}

// Content management
export interface EditableContentProps extends BaseComponentProps {
  content: string;
  contentType: 'text' | 'html' | 'markdown';
  editable?: boolean;
  onSave?: (newContent: string) => Promise<void>;
  placeholder?: string;
}

export interface ContentPreviewProps extends BaseComponentProps {
  content: MarketingContent;
  previewMode?: boolean;
  editingEnabled?: boolean;
  onContentChange?: (content: MarketingContent) => void;
}

// Carousel and interactive components
export interface CarouselProps extends BaseComponentProps {
  children: ReactNode[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  onSlideChange?: (index: number) => void;
  slidesToShow?: number;
  responsiveBreakpoints?: Record<number, { slidesToShow: number }>;
}

export interface TabsProps extends BaseComponentProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  activationMode?: 'automatic' | 'manual';
}

export interface AccordionProps extends BaseComponentProps {
  type?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

// Form components (for future CTA forms)
export interface FormProps extends BaseComponentProps {
  onSubmit: (data: Record<string, any>) => Promise<void>;
  validationSchema?: ValidationRule[];
  autoComplete?: 'on' | 'off';
  noValidate?: boolean;
}

export interface InputProps extends BaseComponentProps, AccessibilityAttributes {
  type?: 'text' | 'email' | 'tel' | 'url' | 'password' | 'search';
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

// Footer component
export interface FooterProps extends BaseComponentProps {
  links: FooterLinkSection[];
  socialLinks?: SocialLinkProps[];
  copyright?: string;
  logo?: LogoProps;
}

export interface FooterLinkSection {
  title: string;
  links: FooterLink[];
}

export interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface SocialLinkProps {
  platform: string;
  href: string;
  icon: string;
  'aria-label': string;
}