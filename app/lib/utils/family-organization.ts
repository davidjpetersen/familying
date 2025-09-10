/**
 * Family Organization Utility Functions
 * 
 * Helper functions for organization detection, validation, and common operations
 */

// Type definitions
export interface FamilyOrganization {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  membersCount: number;
  publicMetadata?: Record<string, unknown>;
  privateMetadata?: Record<string, unknown>;
}

export type FamilyRole = 'admin' | 'basic_member';

export interface FamilyOrganizationError {
  type: 'ORGANIZATION_NOT_FOUND' | 'INSUFFICIENT_PERMISSIONS' | 'CREATION_FAILED' | 'UPDATE_FAILED' | 'MEMBER_LIMIT_EXCEEDED' | 'INVALID_ORGANIZATION_NAME' | 'NETWORK_ERROR' | 'UNAUTHORIZED';
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  requestId: string;
}

// =============================================================================
// Organization Detection Utilities
// =============================================================================

/**
 * Check if user has any organizations
 */
export function hasOrganizations(organizationList: unknown[]): boolean {
  return Array.isArray(organizationList) && organizationList.length > 0;
}

/**
 * Get the current organization from list (assumes first organization is active)
 */
export function getCurrentOrganization(organizationList: unknown[]): FamilyOrganization | undefined {
  if (!hasOrganizations(organizationList)) {
    return undefined;
  }
  
  const org = organizationList[0];
  if (!org) return undefined;
  
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    imageUrl: org.imageUrl,
    createdAt: new Date(org.createdAt),
    updatedAt: new Date(org.updatedAt),
    membersCount: org.membersCount || 1,
    publicMetadata: org.publicMetadata,
    privateMetadata: org.privateMetadata,
  };
}

/**
 * Check if user should see family creation interface
 */
export function shouldShowCreateFamily(isLoaded: boolean, organizationList: unknown[]): boolean {
  return isLoaded && !hasOrganizations(organizationList);
}

/**
 * Check if user should see family settings
 */
export function shouldShowFamilySettings(isLoaded: boolean, organizationList: unknown[]): boolean {
  return isLoaded && hasOrganizations(organizationList);
}

// =============================================================================
// Organization Validation Utilities
// =============================================================================

/**
 * Validate family name according to business rules
 */
export function validateFamilyName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Family name is required';
  }
  
  if (name.trim().length < 2) {
    return 'Family name must be at least 2 characters';
  }
  
  if (name.length > 100) {
    return 'Family name must be less than 100 characters';
  }
  
  // Allow letters, numbers, spaces, hyphens, apostrophes
  const validNamePattern = /^[a-zA-Z0-9\s\-']+$/;
  if (!validNamePattern.test(name)) {
    return 'Family name can only contain letters, numbers, spaces, hyphens, and apostrophes';
  }
  
  return null;
}

/**
 * Validate organization metadata size
 */
export function validateMetadataSize(metadata: Record<string, unknown>): string | null {
  try {
    const jsonString = JSON.stringify(metadata);
    const sizeInBytes = new TextEncoder().encode(jsonString).length;
    const sizeInKB = sizeInBytes / 1024;
    
    if (sizeInKB > 8) {
      return 'Organization metadata cannot exceed 8KB';
    }
    
    return null;
  } catch {
    return 'Invalid metadata format';
  }
}

// =============================================================================
// Role and Permission Utilities
// =============================================================================

/**
 * Check if user has admin role in organization
 */
export function isOrganizationAdmin(userRole?: string): boolean {
  return userRole === 'admin';
}

/**
 * Check if user has sufficient role for operation
 */
export function hasRequiredRole(userRole: string, requiredRole: FamilyRole): boolean {
  if (requiredRole === 'basic_member') {
    return userRole === 'admin' || userRole === 'basic_member';
  }
  
  if (requiredRole === 'admin') {
    return userRole === 'admin';
  }
  
  return false;
}

/**
 * Get display name for family role
 */
export function getRoleDisplayName(role: FamilyRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'basic_member':
      return 'Member';
    default:
      return 'Unknown';
  }
}

// =============================================================================
// URL and Navigation Utilities
// =============================================================================

/**
 * Generate organization settings URL
 */
export function getOrganizationSettingsUrl(organizationId?: string): string {
  return organizationId 
    ? `/settings/organization?org=${organizationId}`
    : '/settings/organization';
}

/**
 * Generate family creation URL
 */
export function getFamilyCreationUrl(): string {
  return '/create-family';
}

/**
 * Determine correct homepage URL based on organization status
 */
export function getHomepageUrl(hasOrganization: boolean): string {
  return hasOrganization ? '/dashboard' : '/';
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

/**
 * Create standardized family organization error
 */
export function createFamilyOrganizationError(
  type: FamilyOrganizationError['type'],
  code: string,
  message: string,
  details?: Record<string, unknown>
): FamilyOrganizationError {
  return {
    type,
    code,
    message,
    details,
    timestamp: new Date(),
    requestId: generateRequestId(),
  };
}

/**
 * Extract user-friendly error message from Clerk error
 */
export function extractErrorMessage(error: unknown): string {
  // Handle Clerk-specific errors
  if (error && typeof error === 'object' && 'errors' in error) {
    const clerkError = error as { errors: Array<{ message: string }> };
    if (clerkError.errors?.[0]?.message) {
      return clerkError.errors[0].message;
    }
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if error is a network/connectivity issue
 */
export function isNetworkError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return message.includes('network') || 
         message.includes('connection') || 
         message.includes('timeout') ||
         message.includes('fetch');
}

// =============================================================================
// Data Transformation Utilities
// =============================================================================

/**
 * Transform Clerk organization to FamilyOrganization
 */
export function transformClerkOrganization(clerkOrg: unknown): FamilyOrganization {
  const org = clerkOrg as {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
    membersCount?: number;
    publicMetadata?: Record<string, unknown>;
    privateMetadata?: Record<string, unknown>;
  };
  
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    imageUrl: org.imageUrl,
    createdAt: new Date(org.createdAt),
    updatedAt: new Date(org.updatedAt),
    membersCount: org.membersCount || 1,
    publicMetadata: org.publicMetadata,
    privateMetadata: org.privateMetadata,
  };
}

/**
 * Extract organization list from Clerk response
 */
export function extractOrganizationList(clerkResponse: unknown): FamilyOrganization[] {
  const response = clerkResponse as { data?: unknown[] };
  if (!response?.data) {
    return [];
  }
  
  return response.data.map(transformClerkOrganization);
}

// =============================================================================
// Helper Utilities
// =============================================================================

/**
 * Generate unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Debounce function for form validation
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Format organization creation date for display
 */
export function formatOrganizationDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Generate family slug from name
 */
export function generateFamilySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if value is a valid FamilyRole
 */
export function isFamilyRole(value: unknown): value is FamilyRole {
  return value === 'admin' || value === 'basic_member';
}

/**
 * Type guard to check if organization has valid structure
 */
export function isFamilyOrganization(value: unknown): value is FamilyOrganization {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.slug === 'string' &&
    value.createdAt instanceof Date &&
    value.updatedAt instanceof Date &&
    typeof value.membersCount === 'number'
  );
}