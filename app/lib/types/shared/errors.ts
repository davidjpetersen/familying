/**
 * Error Types
 * 
 * Standard error handling types for family organization features
 */

/**
 * Types of errors that can occur in family organization operations
 */
export type FamilyOrganizationErrorType = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Standard error object for family organization operations
 */
export interface FamilyOrganizationError {
  /** Error type for programmatic handling */
  type: FamilyOrganizationErrorType;
  /** Human-readable error message */
  message: string;
  /** Optional error code for specific error identification */
  code?: string;
  /** Additional context about the error */
  details?: Record<string, unknown>;
  /** When the error occurred */
  timestamp: Date;
  /** Operation that triggered the error */
  operation?: string;
  /** User-facing suggestion for resolving the error */
  userMessage?: string;
}