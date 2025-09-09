/**
 * Marketing Homepage Type Definitions
 * Generated from data-model.md specifications
 * Constitutional compliance: Privacy-first, accessibility-aware
 */

// Supporting enums
export enum SectionType {
  HERO = 'hero',
  HOW_IT_WORKS = 'how-it-works', 
  TESTIMONIALS = 'testimonials',
  FREE_PREVIEW = 'free-preview',
  DIFFERENTIATION = 'differentiation',
  SOCIAL_PROOF = 'social-proof',
  FINAL_CTA = 'final-cta'
}

export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline'
}

export enum ButtonSize {
  SM = 'sm',
  MD = 'md', 
  LG = 'lg'
}

export enum AvatarSource {
  AI_GENERATED = 'ai-generated',
  STOCK_PHOTO = 'stock-photo',
  ILLUSTRATION = 'illustration'
}

export enum ResourceCategory {
  MEAL_PLANNING = 'meal-planning',
  BEDTIME_ROUTINES = 'bedtime-routines',
  ACTIVITY_GUIDES = 'activity-guides',
  CONVERSATION_STARTERS = 'conversation-starters',
  CALM_TECHNIQUES = 'calm-techniques'
}

export enum ProofType {
  USER_COUNT = 'user-count',
  SATISFACTION_RATING = 'satisfaction-rating',
  MEDIA_MENTION = 'media-mention',
  EXPERT_ENDORSEMENT = 'expert-endorsement',
  COMMUNITY_GROWTH = 'community-growth'
}

export enum AccessLevel {
  PUBLIC = 'public',
  REGISTERED = 'registered',
  PREMIUM = 'premium'
}

// Core interfaces
export interface MarketingContent {
  headline: string; // max 80 chars
  subheadline: string; // max 160 chars
  sections: HomepageSection[];
  metadata: SEOMetadata;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface HomepageSection {
  id: string;
  type: SectionType;
  title: string;
  content: SectionContent;
  isVisible: boolean;
  order: number;
}

export interface SectionContent {
  // Union type based on section type
  hero?: HeroContent;
  howItWorks?: HowItWorksContent;
  testimonials?: TestimonialContent;
  freePreview?: FreePreviewContent;
  differentiation?: DifferentiationContent;
  socialProof?: SocialProofContent;
  finalCta?: FinalCtaContent;
}

// Section-specific content types
export interface HeroContent {
  headline: string;
  subheadline: string;
  primaryCta: CTAButton;
  secondaryCta?: CTAButton;
  heroImage?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
}

export interface HowItWorksContent {
  steps: ProcessStep[];
  animationEnabled: boolean;
}

export interface ProcessStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  icon: string; // Icon component name or path
}

export interface TestimonialContent {
  testimonials: TestimonialItem[];
  displayStyle: 'carousel' | 'grid' | 'stacked';
}

export interface FreePreviewContent {
  title: string;
  description: string;
  resources: ResourcePreview[];
  cta: CTAButton;
}

export interface DifferentiationContent {
  title: string;
  comparison: ComparisonItem[];
  highlights: string[];
}

export interface ComparisonItem {
  category: string;
  competitors: string;
  familying: string;
}

export interface SocialProofContent {
  elements: SocialProofElement[];
  layout: 'horizontal' | 'grid';
}

export interface FinalCtaContent {
  headline: string;
  description?: string;
  cta: CTAButton;
  backgroundColor?: string;
}

// Entity interfaces
export interface CTAButton {
  id: string;
  text: string; // max 30 chars
  href: string;
  variant: ButtonVariant;
  size: ButtonSize;
  ariaLabel: string;
  trackingEvent: string;
  isDisabled: boolean;
  isExternal?: boolean;
}

export interface TestimonialItem {
  id: string;
  quote: string; // max 280 chars
  attribution: Attribution;
  avatar: Avatar;
  familyContext: string;
  location: string; // city, state only
  isVerified: boolean; // must be true for display
}

export interface Attribution {
  displayName: string; // first name + last initial only
  familyRole: string;
  childrenContext: string;
  location: string;
  consentDate: Date;
  consentMethod: string;
}

export interface Avatar {
  id: string;
  filename: string;
  altText: string;
  demographics: Demographics;
  source: AvatarSource;
  optimizedVersions: ImageVariant[];
}

export interface Demographics {
  ageRange: string;
  familyStructure: string;
  ethnicity?: string;
  accessibility?: string;
}

export interface ImageVariant {
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  width: number;
  height: number;
  url: string;
  size: number; // bytes
  blurDataUrl?: string;
}

export interface ResourcePreview {
  id: string;
  title: string; // max 50 chars
  description: string; // max 120 chars
  category: ResourceCategory;
  thumbnailImage: string;
  downloadUrl?: string;
  isPremium: boolean;
  fileFormat: string;
  fileSize?: number;
}

export interface SocialProofElement {
  id: string;
  type: ProofType;
  displayValue: string;
  actualValue?: number;
  lastUpdated: Date;
  source: string;
  hasPermission: boolean;
  disclaimer?: string;
}

export interface NavigationItem {
  id: string;
  label: string; // max 20 chars
  href: string;
  isAvailable: boolean;
  isExternal: boolean;
  order: number;
  accessLevel: AccessLevel;
}

// Component props interfaces
export interface HeroSectionProps {
  content: HeroContent;
  className?: string;
}

export interface HowItWorksSectionProps {
  content: HowItWorksContent;
  className?: string;
}

export interface TestimonialsSectionProps {
  content: TestimonialContent;
  className?: string;
}

export interface FreePreviewSectionProps {
  content: FreePreviewContent;
  className?: string;
}

export interface DifferentiationSectionProps {
  content: DifferentiationContent;
  className?: string;
}

export interface SocialProofSectionProps {
  content: SocialProofContent;
  className?: string;
}

export interface FinalCtaSectionProps {
  content: FinalCtaContent;
  className?: string;
}

export interface CTAButtonProps {
  button: CTAButton;
  onClick?: (event: React.MouseEvent, trackingEvent: string) => void;
  className?: string;
}

export interface TestimonialCardProps {
  testimonial: TestimonialItem;
  className?: string;
}

export interface ResourceCardProps {
  resource: ResourcePreview;
  onDownload?: (resourceId: string) => void;
  className?: string;
}

// Analytics and tracking interfaces
export interface TrackingEvent {
  eventName: string;
  eventCategory: 'cta' | 'navigation' | 'engagement' | 'download';
  eventLabel?: string;
  eventValue?: number;
  customProperties?: Record<string, any>;
}

export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

// Accessibility interfaces
export interface AccessibilityAttributes {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
  ariaCurrent?: string;
  ariaExpanded?: boolean;
  ariaHidden?: boolean;
}