/**
 * Component Contracts for Family Organization Management
 * 
 * These TypeScript interfaces define the expected behavior and props
 * for React components in the family organization feature.
 */

// =============================================================================
// Hook Contracts
// =============================================================================

/**
 * Organization Navigation Hook Contract
 * Provides organization-aware navigation state
 */
export interface UseOrganizationNavigationReturn {
  /** Whether user belongs to any organization */
  hasOrganization: boolean;
  /** Whether Clerk data has finished loading */
  isLoaded: boolean;
  /** Whether to show create family interface */
  shouldShowCreateFamily: boolean;
  /** Whether to show family settings */
  shouldShowFamilySettings: boolean;
  /** Current organization (if any) */
  currentOrganization?: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
  };
}

/**
 * Family Creation Hook Contract
 * Manages family creation flow state
 */
export interface UseFamilyCreationReturn {
  /** Whether creation is in progress */
  isCreating: boolean;
  /** Creation error message */
  error?: string;
  /** Create family function */
  createFamily: (name: string, metadata?: Record<string, any>) => Promise<void>;
  /** Reset creation state */
  reset: () => void;
}

// =============================================================================
// Component Props Contracts
// =============================================================================

/**
 * Create Family Form Component Contract
 */
export interface CreateFamilyFormProps {
  /** Callback when family is successfully created */
  onCreated?: (organizationId: string) => void;
  /** Callback when creation is cancelled */
  onCancel?: () => void;
  /** Custom CSS classes */
  className?: string;
  /** Whether to redirect after creation */
  redirectAfterCreation?: boolean;
  /** Custom redirect path */
  redirectPath?: string;
}

/**
 * Organization Profile Component Contract
 */
export interface OrganizationProfileProps {
  /** Organization ID to display (optional, defaults to current) */
  organizationId?: string;
  /** Callback when profile is updated */
  onUpdated?: (organizationId: string) => void;
  /** Custom CSS classes */
  className?: string;
  /** Whether to show member management */
  showMemberManagement?: boolean;
  /** Whether to show organization settings */
  showSettings?: boolean;
}

/**
 * Family Status Display Component Contract
 */
export interface FamilyStatusProps {
  /** Whether to show full organization details */
  detailed?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Callback when user clicks to create family */
  onCreateFamily?: () => void;
  /** Callback when user clicks to manage family */
  onManageFamily?: () => void;
}

// =============================================================================
// Navigation Guard Contracts
// =============================================================================

/**
 * Organization Required Guard Contract
 * Redirects users without organizations to creation flow
 */
export interface OrganizationRequiredProps {
  /** Child components to render when organization exists */
  children: React.ReactNode;
  /** Custom redirect path for non-members */
  redirectTo?: string;
  /** Loading component while checking organization status */
  fallback?: React.ReactNode;
}

/**
 * Organization Member Guard Contract
 * Restricts access based on organization membership and role
 */
export interface OrganizationMemberGuardProps {
  /** Child components to render when authorized */
  children: React.ReactNode;
  /** Required role (optional, defaults to any member) */
  requiredRole?: 'admin' | 'basic_member';
  /** Component to render when unauthorized */
  fallback?: React.ReactNode;
  /** Organization ID to check (optional, defaults to current) */
  organizationId?: string;
}

// =============================================================================
// Event Contracts
// =============================================================================

/**
 * Family Creation Events
 */
export interface FamilyCreationEvents {
  /** Family creation started */
  'family:creation:started': {
    name: string;
    userId: string;
    timestamp: Date;
  };
  
  /** Family creation completed */
  'family:creation:completed': {
    organizationId: string;
    name: string;
    userId: string;
    timestamp: Date;
  };
  
  /** Family creation failed */
  'family:creation:failed': {
    name: string;
    userId: string;
    error: string;
    timestamp: Date;
  };
}

/**
 * Organization Profile Events
 */
export interface OrganizationProfileEvents {
  /** Organization profile viewed */
  'organization:profile:viewed': {
    organizationId: string;
    userId: string;
    timestamp: Date;
  };
  
  /** Organization profile updated */
  'organization:profile:updated': {
    organizationId: string;
    userId: string;
    changes: Record<string, any>;
    timestamp: Date;
  };
  
  /** Member added to organization */
  'organization:member:added': {
    organizationId: string;
    newMemberId: string;
    addedBy: string;
    role: string;
    timestamp: Date;
  };
}

// =============================================================================
// Error Contracts
// =============================================================================

/**
 * Family Organization Error Types
 */
export type FamilyOrganizationError = 
  | 'ORGANIZATION_NOT_FOUND'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'CREATION_FAILED'
  | 'UPDATE_FAILED'
  | 'MEMBER_LIMIT_EXCEEDED'
  | 'INVALID_ORGANIZATION_NAME'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED';

/**
 * Error Response Contract
 */
export interface FamilyOrganizationErrorResponse {
  /** Error type */
  type: FamilyOrganizationError;
  /** Human-readable error message */
  message: string;
  /** Additional error context */
  details?: Record<string, any>;
  /** Timestamp of error */
  timestamp: Date;
  /** Correlation ID for debugging */
  correlationId?: string;
}

// =============================================================================
// Accessibility Contracts
// =============================================================================

/**
 * Accessibility Requirements for Family Components
 */
export interface FamilyComponentAccessibility {
  /** ARIA label for screen readers */
  'aria-label'?: string;
  /** ARIA description for complex components */
  'aria-describedby'?: string;
  /** Role for semantic meaning */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Whether component can receive focus */
  focusable?: boolean;
}

// =============================================================================
// Testing Contracts
// =============================================================================

/**
 * Mock Organization Data for Testing
 */
export interface MockOrganizationData {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  membersCount: number;
  userRole: 'admin' | 'basic_member';
}

/**
 * Test Utilities Contract
 */
export interface FamilyOrganizationTestUtils {
  /** Create mock organization data */
  createMockOrganization: (overrides?: Partial<MockOrganizationData>) => MockOrganizationData;
  
  /** Mock Clerk hooks with test data */
  mockClerkHooks: (organizationData?: MockOrganizationData[]) => void;
  
  /** Wait for async organization operations */
  waitForOrganizationLoad: () => Promise<void>;
  
  /** Simulate organization creation */
  simulateOrganizationCreation: (name: string) => Promise<MockOrganizationData>;
}

// =============================================================================
// Performance Contracts
// =============================================================================

/**
 * Performance Requirements
 */
export interface FamilyOrganizationPerformance {
  /** Component render time target (ms) */
  renderTimeTarget: number;
  /** Organization data load time target (ms) */
  dataLoadTimeTarget: number;
  /** Maximum re-renders per user interaction */
  maxReRenders: number;
  /** Memory usage limit (MB) */
  memoryLimit: number;
}

/**
 * Performance Monitoring Contract
 */
export interface FamilyOrganizationMetrics {
  /** Track component render performance */
  trackRenderTime: (componentName: string, duration: number) => void;
  
  /** Track organization data fetch performance */
  trackDataFetchTime: (operation: string, duration: number) => void;
  
  /** Track user interaction latency */
  trackInteractionLatency: (interaction: string, duration: number) => void;
}

export default {};