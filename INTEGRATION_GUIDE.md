# Clean Architecture Integration Guide

## Overview

Your Next.js application has been successfully integrated with a clean architecture pattern. This provides:

- **Domain-Driven Design**: Business logic separated from infrastructure
- **CQRS Pattern**: Command/Query separation for better scalability
- **Dependency Injection**: Loosely coupled, testable components
- **Repository Pattern**: Abstract data access layer
- **Event-Driven Architecture**: Decoupled communication between components

## Key Integration Points

### 1. API Routes (`/src/app/api/admin/`)

```typescript
// Example: Create admin
POST /api/admin
{
  "clerkUserId": "user_123",
  "email": "admin@example.com",
  "role": "admin"
}

// Example: Update admin role
PUT /api/admin/[id]
{
  "role": "super_admin"
}

// Example: Check permissions
GET /api/admin/permissions?permission=MANAGE_USERS
```

### 2. Server Components (Updated admin page)

```typescript
// /src/app/admin/page.tsx
import { checkIsAdmin } from '@/lib/admin-adapter';

export default async function AdminPage() {
  const admin = await checkIsAdmin(userId);
  // Uses clean architecture under the hood
}
```

### 3. Client Components

```typescript
// /src/components/admin/AdminManagement.tsx
import { useAdmins } from '@/hooks/useAdmins';

export function AdminManagement() {
  const { admins, createAdmin, updateAdminRole } = useAdmins();
  // Interacts with clean architecture via API
}
```

### 4. Permission Guards

```typescript
import { PermissionGuard } from '@/components/PermissionGuard';

<PermissionGuard permission="MANAGE_USERS">
  <AdminOnlyComponent />
</PermissionGuard>
```

## Migration Strategy

### Phase 1: ✅ COMPLETED
- Clean architecture foundation
- Domain entities and business logic
- Repository interfaces and implementations
- API integration layer

### Phase 2: Replace existing admin.ts usage

Replace imports in your existing files:

```typescript
// OLD
import { checkIsAdmin, getAllAdmins } from '@/lib/admin';

// NEW
import { checkIsAdmin, getAllAdmins } from '@/lib/admin-adapter';
```

### Phase 3: Enhanced Features

```typescript
// Permission-based UI rendering
const { hasPermission } = usePermissions();

if (await hasPermission('MANAGE_PLUGINS')) {
  // Show plugin management UI
}

// Bulk operations
const adminService = container.resolve(SERVICE_TOKENS.ADMIN_SERVICE);
const result = await adminService.bulkUpdateRoles(updates);
```

## Benefits Achieved

1. **Type Safety**: Full TypeScript coverage with domain types
2. **Testability**: Easy unit testing with mocked dependencies
3. **Scalability**: CQRS pattern supports read/write scaling
4. **Maintainability**: Clear separation of concerns
5. **Performance**: Repository pattern enables caching strategies
6. **Security**: Permission-based access control

## Usage Examples

### Creating an Admin (Client-side)
```typescript
const { createAdmin } = useAdmins();
await createAdmin({
  clerkUserId: 'user_123',
  email: 'new-admin@example.com',
  role: 'moderator'
});
```

### Checking Permissions (Server-side)
```typescript
import { checkAdminPermission } from '@/lib/admin-adapter';

const canManageUsers = await checkAdminPermission(userId, 'MANAGE_USERS');
```

### Protected API Routes
```typescript
import { withAdminAuth } from '@/lib/admin-middleware';

export const GET = withAdminAuth(async (request) => {
  // This handler only runs for authenticated admins
}, 'MANAGE_PLUGINS');
```

## Next Steps

1. **Replace** existing `/src/lib/admin.ts` usage with `/src/lib/admin-adapter.ts`
2. **Update** your current admin page to use the new `/src/app/admin/page-new.tsx`
3. **Add** permission guards to sensitive UI components
4. **Extend** the architecture for user management and plugins
5. **Implement** event-driven features (notifications, audit logs)

The architecture is designed to be backward-compatible, so you can migrate gradually while maintaining existing functionality.
