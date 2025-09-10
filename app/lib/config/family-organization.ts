/**
 * Family Organization Feature Configuration
 * 
 * Configuration constants and feature flags for family organization management
 */

// =============================================================================
// Feature Configuration
// =============================================================================

/**
 * Main configuration for family organization features
 */
export const FAMILY_ORGANIZATION_CONFIG = {
  /** Maximum number of families per user */
  maxFamiliesPerUser: 5,
  
  /** Maximum number of members per family */
  maxMembersPerFamily: 50,
  
  /** Default family metadata applied to new organizations */
  defaultMetadata: {
    preferences: {
      mealPlanningDay: 'sunday',
      activityReminders: true,
      weeklyDigest: false,
    },
    settings: {
      timezone: 'America/New_York',
      language: 'en',
      childSafetyMode: false,
    },
  },
  
  /** Feature flags for conditional functionality */
  features: {
    /** Enable multiple family membership (future feature) */
    multipleFamilies: false,
    
    /** Enable family invitations */
    invitations: true,
    
    /** Enable family photos */
    photos: true,
    
    /** Enable advanced settings for admins */
    advancedSettings: true,
  },
  
  /** API configuration for Clerk integration */
  api: {
    /** Clerk organization API timeout (ms) */
    timeout: 10000,
    
    /** Retry configuration for failed requests */
    retries: {
      max: 3,
      delay: 1000,
    },
  },
};

// =============================================================================
// Validation Constants
// =============================================================================

/**
 * Family name validation rules
 */
export const FAMILY_NAME_VALIDATION = {
  /** Minimum length for family name */
  minLength: 2,
  
  /** Maximum length for family name */
  maxLength: 100,
  
  /** Regular expression for valid family name characters */
  pattern: /^[a-zA-Z0-9\s\-']+$/,
  
  /** Error messages for validation failures */
  errors: {
    required: 'Family name is required',
    minLength: 'Family name must be at least 2 characters',
    maxLength: 'Family name must be less than 100 characters',
    pattern: 'Family name can only contain letters, numbers, spaces, hyphens, and apostrophes',
  },
} as const;

/**
 * Organization metadata size limits
 */
export const METADATA_LIMITS = {
  /** Maximum size for metadata in kilobytes */
  maxSizeKB: 8,
  
  /** Maximum size for metadata in bytes */
  maxSizeBytes: 8 * 1024,
  
  /** Error message for oversized metadata */
  oversizeError: 'Organization metadata cannot exceed 8KB',
} as const;

// =============================================================================
// UI Configuration
// =============================================================================

/**
 * UI-related configuration constants
 */
export const UI_CONFIG = {
  /** Loading timeouts for user experience */
  timeouts: {
    /** How long to show loading state before showing error */
    loadingTimeout: 15000,
    
    /** Delay before showing skeleton loaders */
    skeletonDelay: 200,
    
    /** Auto-dismiss timeout for success messages */
    successMessageTimeout: 3000,
  },
  
  /** Animation durations */
  animations: {
    /** Page transition duration (ms) */
    pageTransition: 300,
    
    /** Component fade in/out duration (ms) */
    fadeTransition: 200,
    
    /** Form field validation feedback delay (ms) */
    validationDelay: 500,
  },
  
  /** Responsive breakpoints for family components */
  breakpoints: {
    /** Mobile breakpoint */
    mobile: 640,
    
    /** Tablet breakpoint */
    tablet: 768,
    
    /** Desktop breakpoint */
    desktop: 1024,
  },
} as const;

// =============================================================================
// Route Configuration
// =============================================================================

/**
 * Route paths for family organization features
 */
export const FAMILY_ROUTES = {
  /** Family creation page */
  createFamily: '/create-family',
  
  /** Organization settings page */
  organizationSettings: '/settings/organization',
  
  /** Dashboard for family members */
  dashboard: '/dashboard',
  
  /** Homepage for non-members */
  homepage: '/',
  
  /** Authentication pages */
  signIn: '/sign-in',
  signUp: '/sign-up',
} as const;

/**
 * Route guard configuration
 */
export const ROUTE_GUARDS = {
  /** Routes that require organization membership */
  organizationRequired: [
    FAMILY_ROUTES.organizationSettings,
    FAMILY_ROUTES.dashboard,
  ],
  
  /** Routes that require admin role */
  adminRequired: [
    '/settings/organization/members',
    '/settings/organization/advanced',
  ],
  
  /** Routes that redirect to dashboard for organization members */
  redirectToDashboard: [
    FAMILY_ROUTES.createFamily,
  ],
} as const;

// =============================================================================
// Error Messages
// =============================================================================

/**
 * Standardized error messages for family organization features
 */
export const ERROR_MESSAGES = {
  /** Generic errors */
  generic: {
    unknown: 'An unexpected error occurred. Please try again.',
    network: 'Network error. Please check your connection and try again.',
    timeout: 'Request timed out. Please try again.',
    unauthorized: 'You are not authorized to perform this action.',
  },
  
  /** Organization creation errors */
  creation: {
    failed: 'Failed to create family organization. Please try again.',
    nameExists: 'A family with this name already exists.',
    limitExceeded: 'You have reached the maximum number of families allowed.',
    invalidData: 'Please check your family information and try again.',
  },
  
  /** Organization access errors */
  access: {
    notFound: 'Family organization not found.',
    noPermission: 'You do not have permission to access this family.',
    notMember: 'You are not a member of this family organization.',
    adminRequired: 'Administrator privileges required for this action.',
  },
  
  /** Organization updates errors */
  update: {
    failed: 'Failed to update family organization. Please try again.',
    concurrentModification: 'Someone else has modified this family. Please refresh and try again.',
    invalidMetadata: 'Invalid family settings. Please check your input.',
  },
} as const;

// =============================================================================
// Success Messages
// =============================================================================

/**
 * Success messages for family organization operations
 */
export const SUCCESS_MESSAGES = {
  /** Organization creation */
  creation: {
    success: 'Family created successfully! Welcome to your new family organization.',
    redirecting: 'Redirecting to your family dashboard...',
  },
  
  /** Organization updates */
  update: {
    success: 'Family settings updated successfully.',
    profileSaved: 'Family profile saved.',
    preferencesUpdated: 'Family preferences updated.',
  },
  
  /** Member management */
  members: {
    invited: 'Family member invitation sent successfully.',
    removed: 'Family member removed successfully.',
    roleChanged: 'Member role updated successfully.',
  },
} as const;

// =============================================================================
// Analytics Events
// =============================================================================

/**
 * Analytics event names for tracking family organization usage
 */
export const ANALYTICS_EVENTS = {
  /** Family creation funnel */
  creation: {
    started: 'family_creation_started',
    completed: 'family_creation_completed',
    abandoned: 'family_creation_abandoned',
    failed: 'family_creation_failed',
  },
  
  /** Organization management */
  management: {
    settingsViewed: 'family_settings_viewed',
    profileUpdated: 'family_profile_updated',
    preferencesChanged: 'family_preferences_changed',
    memberInvited: 'family_member_invited',
  },
  
  /** Navigation events */
  navigation: {
    dashboardAccessed: 'family_dashboard_accessed',
    settingsAccessed: 'family_settings_accessed',
    createFamilyViewed: 'create_family_viewed',
  },
} as const;

// =============================================================================
// Performance Targets
// =============================================================================

/**
 * Performance targets for family organization features
 */
export const PERFORMANCE_TARGETS = {
  /** Page load performance */
  pageLoad: {
    /** Largest Contentful Paint target (ms) */
    lcp: 2000,
    
    /** First Input Delay target (ms) */
    fid: 100,
    
    /** Cumulative Layout Shift target */
    cls: 0.1,
  },
  
  /** Component render performance */
  components: {
    /** Maximum render time for family components (ms) */
    maxRenderTime: 100,
    
    /** Maximum re-renders per user interaction */
    maxReRenders: 3,
  },
  
  /** API response targets */
  api: {
    /** Organization data fetch target (ms) */
    dataFetch: 500,
    
    /** Organization creation target (ms) */
    creation: 2000,
    
    /** Organization update target (ms) */
    update: 1000,
  },
} as const;

// =============================================================================
// Environment-specific Configuration
// =============================================================================

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    /** Enable debug logging */
    debug: isDevelopment,
    
    /** API timeout adjustments for development */
    apiTimeout: isDevelopment ? 30000 : FAMILY_ORGANIZATION_CONFIG.api.timeout,
    
    /** Enable mock data in development */
    enableMocks: isDevelopment,
    
    /** Stricter validation in production */
    strictValidation: isProduction,
    
    /** Analytics enabled in production only */
    analyticsEnabled: isProduction,
  };
}

/**
 * Export default configuration
 */
export default FAMILY_ORGANIZATION_CONFIG;