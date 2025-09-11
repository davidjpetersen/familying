/**
 * TypeScript Types Index
 * 
 * Consolidated exports for all type definitions in the application.
 * Organized by domain and concern for better maintainability.
 */

// Domain Types
export * from './domain/family';
export * from './domain/recipes';

// Shared Types
export * from './shared/common';
export * from './shared/api';
export * from './shared/errors';

// Component Types (re-exported for backward compatibility)
export * from './family-organization-components';

// Legacy Marketing Types (consider moving to domain/marketing.ts)
export * from './marketing';

// State and Context Types (extracted from original family-organization.ts)
export * from './state/creation';
export * from './state/navigation';
export * from './state/profile';