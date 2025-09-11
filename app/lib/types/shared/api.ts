/**
 * API Response Types
 * 
 * Standard types for API requests and responses
 */

/**
 * Standard API response wrapper for organization lists
 */
export interface OrganizationListResponse<T = Record<string, unknown>> {
  /** Array of organization data */
  data: T[];
  /** Total count of organizations (for pagination) */
  totalCount: number;
  /** Pagination metadata */
  pagination?: {
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Request payload for creating a new organization
 */
export interface CreateOrganizationRequest {
  /** Organization name */
  name: string;
  /** Optional URL slug */
  slug?: string;
  /** Optional organization image */
  imageUrl?: string;
  /** Public metadata to set on creation */
  publicMetadata?: Record<string, unknown>;
  /** Private metadata to set on creation */
  privateMetadata?: Record<string, unknown>;
}

/**
 * Response from organization creation
 */
export interface CreateOrganizationResponse {
  /** Created organization data */
  organization: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    createdAt: string;
  };
  /** Whether the operation was successful */
  success: boolean;
  /** Any error messages */
  errors?: string[];
}

/**
 * Request payload for updating an organization
 */
export interface UpdateOrganizationRequest {
  /** Organization name */
  name?: string;
  /** Organization slug */
  slug?: string;
  /** Organization image */
  imageUrl?: string;
}