# Component Style Guide

This guide establishes consistent patterns for React components in this codebase.

## Export Patterns

### Primary Component Export
Use **named exports** as the primary pattern:

```typescript
// ✅ PREFERRED: Named export
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  return <div>...</div>;
}
```

### When to Use Default Exports
Add default exports **only** when the component is the primary export of the file:

```typescript
// ✅ ACCEPTABLE: Named + default export for primary components
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  return <div>...</div>;
}

export default ComponentName;
```

### Multiple Components in One File
For utility or shared components, use only named exports:

```typescript
// ✅ GOOD: Multiple related components
export function GuardLoadingSpinner({ message }: SpinnerProps) {
  return <div>Loading: {message}</div>;
}

export function GuardErrorMessage({ title, message }: ErrorProps) {
  return <div>{title}: {message}</div>;
}

// ❌ AVOID: Default export when multiple components exist
```

## Component Naming

### Component Names
- Use PascalCase for component names
- Be descriptive and specific
- Include the domain/feature when relevant

```typescript
// ✅ GOOD
export function UserProfileCard() { ... }
export function AuthenticationGuard() { ... }
export function FamilyCreationForm() { ... }

// ❌ AVOID
export function Card() { ... }        // Too generic
export function Guard() { ... }       // Too generic
export function userProfile() { ... } // Wrong case
```

### File Names
- Use kebab-case for file names
- Match the primary component name

```
✅ GOOD:
user-profile-card.tsx → UserProfileCard
authentication-guard.tsx → AuthenticationGuard
family-creation-form.tsx → FamilyCreationForm

❌ AVOID:
UserProfile.tsx
user_profile.tsx
```

## Component Structure

### Standard Component Template

```typescript
/**
 * Component Description
 * 
 * Brief description of what this component does and when to use it.
 */

'use client'; // Only if needed

import React from 'react';
import { RequiredImports } from 'libraries';

// Props interface
interface ComponentNameProps {
  /** Description of prop */
  prop1: string;
  /** Optional prop with default */
  prop2?: boolean;
}

/**
 * JSDoc description of the component
 */
export function ComponentName({
  prop1,
  prop2 = false,
}: ComponentNameProps) {
  // Component logic here
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}

// Only add default export if this is the primary component
export default ComponentName;
```

## Import/Export Patterns

### Importing Components

```typescript
// ✅ PREFERRED: Named imports
import { ComponentName } from './component-name';
import { GuardLoadingSpinner, GuardErrorMessage } from './shared/GuardComponents';

// ✅ ACCEPTABLE: Default imports only when needed
import ComponentName from './component-name';
```

### Index Files
Use index files to re-export related components:

```typescript
// components/guards/index.ts
export { AuthenticationGuard } from './AuthenticationGuard';
export { OrganizationMembershipGuard } from './OrganizationMembershipGuard';
export { RoleGuard } from './RoleGuard';

// Deprecated exports (mark clearly)
export { OrganizationMemberGuard } from './OrganizationMemberGuard'; // DEPRECATED
```

## Migration Strategy

For existing components that don't follow these patterns:

1. **Phase 1**: Keep existing exports, add preferred exports
2. **Phase 2**: Update imports throughout codebase  
3. **Phase 3**: Remove deprecated exports

Example:
```typescript
// During migration
export function PreferredName() { ... }  // New preferred export
export default PreferredName;           // Keep for compatibility
export { PreferredName as OldName };    // Deprecated alias
```