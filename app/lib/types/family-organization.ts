/**
 * Type Definitions for Family Organization Management
 * 
 * Core TypeScript types used throughout the family organization feature.
 * These types ensure type safety and consistent data structures.
 */

// =============================================================================
// Core Domain Types
// =============================================================================

/**
 * Family Organization
 * Represents a family unit managed through Clerk Organizations
 */
export interface FamilyOrganization {
  /** Unique organization identifier */
  id: string;
  /** Family display name */
  name: string;
  /** URL-safe slug for routing */
  slug: string;
  /** Family avatar/photo URL */
  imageUrl?: string;
  /** Organization creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
  /** Number of family members */
  membersCount: number;
  /** Organization metadata */
  publicMetadata?: FamilyPublicMetadata;
  privateMetadata?: FamilyPrivateMetadata;
}

/**
 * Family Member
 * Represents a user's membership in a family organization
 */
export interface FamilyMember {
  /** Unique user identifier */
  userId: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email?: string;
  /** User's avatar URL */
  imageUrl?: string;
  /** User's role in the family */
  role: FamilyRole;
  /** Membership creation date */
  joinedAt: Date;
  /** Last activity timestamp */
  lastActiveAt?: Date;
}

/**
 * Family Role Enumeration
 */
export type FamilyRole = 'admin' | 'basic_member';

/**
 * Family Public Metadata
 * Information visible to all family members
 */
export interface FamilyPublicMetadata {
  /** Family description or motto */
  description?: string;
  /** Family location (city, state) */
  location?: string;
  /** Family preferences */
  preferences?: {
    /** Preferred meal planning day */
    mealPlanningDay?: WeekDay;
    /** Activity reminder settings */
    activityReminders?: boolean;
    /** Weekly digest email preference */
    weeklyDigest?: boolean;
  };
  /** Family settings */
  settings?: {
    /** Family timezone */
    timezone?: string;
    /** Preferred language */
    language?: string;
    /** Child safety mode enabled */
    childSafetyMode?: boolean;
  };
}

/**
 * Family Private Metadata
 * Information visible only to family admins
 */
export interface FamilyPrivateMetadata {
  /** Household information */
  household?: {
    /** Street address (for location-based features) */
    address?: string;
    /** Total household member count */
    memberCount?: number;
    /** Age ranges of children */
    childAgeRanges?: AgeRange[];
  };
  /** Family admin preferences */
  adminSettings?: {
    /** Member invitation policy */
    invitationPolicy?: 'admin_only' | 'any_member';
    /** Maximum family size */
    maxMembers?: number;
    /** Data retention preferences */
    dataRetention?: DataRetentionSettings;
  };
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Days of the week
 */
export type WeekDay = 
  | 'monday' 
  | 'tuesday' 
  | 'wednesday' 
  | 'thursday' 
  | 'friday' 
  | 'saturday' 
  | 'sunday';

/**
 * Age ranges for children
 */
export type AgeRange = 
  | 'infant' // 0-12 months
  | 'toddler' // 1-3 years
  | 'preschool' // 3-5 years
  | 'school_age' // 6-12 years
  | 'teen' // 13-18 years
  | 'adult'; // 18+ years

/**
 * Data retention settings
 */
export interface DataRetentionSettings {
  /** Activity data retention period (days) */
  activityData?: number;
  /** Meal plan retention period (days) */
  mealPlans?: number;
  /** Family photos retention period (days) */
  photos?: number;
  /** Automatic cleanup enabled */
  autoCleanup?: boolean;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Organization List Response
 * Response from Clerk's organization list API
 */
export interface OrganizationListResponse {
  /** List of organizations user belongs to */
  organizations: FamilyOrganization[];
  /** Total count of organizations */
  totalCount: number;
  /** Whether data is loaded */
  isLoaded: boolean;
}

/**
 * Organization Creation Request
 */
export interface CreateOrganizationRequest {
  /** Family name */
  name: string;
  /** Optional family slug */
  slug?: string;
  /** Optional family avatar */
  imageUrl?: string;
  /** Optional initial metadata */
  publicMetadata?: FamilyPublicMetadata;
  privateMetadata?: FamilyPrivateMetadata;
}

/**
 * Organization Creation Response
 */
export interface CreateOrganizationResponse {
  /** Created organization */
  organization: FamilyOrganization;
  /** User's membership in the new organization */
  membership: FamilyMember;
  /** Success indicator */
  success: boolean;
  /** Error message if creation failed */
  error?: string;
}

/**
 * Organization Update Request
 */
export interface UpdateOrganizationRequest {
  /** Organization ID to update */
  organizationId: string;
  /** Updated organization data */
  data: Partial<Pick<FamilyOrganization, 'name' | 'imageUrl' | 'publicMetadata' | 'privateMetadata'>>;
}

// =============================================================================
// Component State Types
// =============================================================================

/**
 * Family Creation Form State
 */
export interface FamilyCreationState {
  /** Current step in creation flow */
  currentStep: 'details' | 'preferences' | 'confirmation' | 'complete';
  /** Form data */
  formData: {
    name: string;
    description?: string;
    location?: string;
    preferences?: Partial<FamilyPublicMetadata['preferences']>;
    settings?: Partial<FamilyPublicMetadata['settings']>;
  };
  /** Validation errors */
  errors: Record<string, string>;
  /** Submission state */
  isSubmitting: boolean;
  /** Submission error */
  submitError?: string;
}

/**
 * Organization Profile State
 */
export interface OrganizationProfileState {
  /** Current organization data */
  organization?: FamilyOrganization;
  /** Family members */
  members: FamilyMember[];
  /** Data loading state */
  isLoading: boolean;
  /** Data error state */
  error?: string;
  /** Unsaved changes indicator */
  hasUnsavedChanges: boolean;
}

// =============================================================================
// Navigation Types
// =============================================================================

/**
 * Organization Navigation Context
 */
export interface OrganizationNavigationContext {
  /** Current organization (if any) */
  currentOrganization?: FamilyOrganization;
  /** Whether user has any organizations */
  hasOrganization: boolean;
  /** Whether organization data is loaded */
  isLoaded: boolean;
  /** Available navigation actions */
  actions: {
    createFamily: () => void;
    switchFamily: (organizationId: string) => void;
    manageFamily: () => void;
    leaveFamily: () => void;
  };
}

/**
 * Organization Route Guard State
 */
export interface OrganizationRouteGuardState {
  /** Whether route is accessible */
  isAccessible: boolean;
  /** Reason for access denial */
  denialReason?: 'no_organization' | 'insufficient_role' | 'loading' | 'error';
  /** Suggested redirect path */
  redirectPath?: string;
  /** Loading state */
  isLoading: boolean;
}

// =============================================================================
// Event Types
// =============================================================================

/**
 * Family Organization Events
 */
export interface FamilyOrganizationEvents {
  /** Organization created */
  organizationCreated: {
    organizationId: string;
    name: string;
    createdBy: string;
  };
  
  /** Organization updated */
  organizationUpdated: {
    organizationId: string;
    changes: Partial<FamilyOrganization>;
    updatedBy: string;
  };
  
  /** Member joined organization */
  memberJoined: {
    organizationId: string;
    memberId: string;
    role: FamilyRole;
  };
  
  /** Member left organization */
  memberLeft: {
    organizationId: string;
    memberId: string;
  };
  
  /** Member role changed */
  memberRoleChanged: {
    organizationId: string;
    memberId: string;
    oldRole: FamilyRole;
    newRole: FamilyRole;
    changedBy: string;
  };
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Family Organization Error Categories
 */
export type FamilyOrganizationErrorType = 
  | 'VALIDATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Family Organization Error
 */
export interface FamilyOrganizationError {
  /** Error type */
  type: FamilyOrganizationErrorType;
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Request ID for tracing */
  requestId?: string;
}

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Family Organization Feature Configuration
 */
export interface FamilyOrganizationConfig {
  /** Maximum number of families per user */
  maxFamiliesPerUser: number;
  /** Maximum number of members per family */
  maxMembersPerFamily: number;
  /** Default family metadata */
  defaultMetadata: Partial<FamilyPublicMetadata>;
  /** Feature flags */
  features: {
    /** Enable multiple family membership */
    multipleFamilies: boolean;
    /** Enable family invitations */
    invitations: boolean;
    /** Enable family photos */
    photos: boolean;
    /** Enable advanced settings */
    advancedSettings: boolean;
  };
  /** API configuration */
  api: {
    /** Clerk organization API timeout (ms) */
    timeout: number;
    /** Retry configuration */
    retries: {
      max: number;
      delay: number;
    };
  };
}

// =============================================================================
// Testing Types
// =============================================================================

/**
 * Mock Family Organization for Testing
 */
export interface MockFamilyOrganization extends FamilyOrganization {
  /** Test-specific properties */
  _test?: {
    /** Simulate loading state */
    isLoading?: boolean;
    /** Simulate error state */
    error?: FamilyOrganizationError;
    /** Override member count */
    mockMembersCount?: number;
  };
}

/**
 * Test Scenario Configuration
 */
export interface FamilyOrganizationTestScenario {
  /** Scenario name */
  name: string;
  /** Initial user state */
  userState: {
    hasOrganizations: boolean;
    organizations: MockFamilyOrganization[];
    currentRole?: FamilyRole;
  };
  /** Expected outcomes */
  expectations: {
    shouldShowCreateFamily: boolean;
    shouldShowFamilySettings: boolean;
    shouldRedirectTo?: string;
  };
}

// Export default empty object to satisfy linting
const familyOrganizationTypes = {};
export default familyOrganizationTypes;