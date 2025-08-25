import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format')
export const uuidSchema = z.string().uuid('Invalid UUID format')
export const nonEmptyStringSchema = z.string().min(1, 'Field cannot be empty')

// Admin related schemas
export const adminRoleSchema = z.enum(['super_admin', 'admin', 'moderator'])

export const createAdminSchema = z.object({
  clerkUserId: nonEmptyStringSchema,
  email: emailSchema,
  role: adminRoleSchema.default('admin')
})

export const updateAdminRoleSchema = z.object({
  adminId: uuidSchema,
  role: adminRoleSchema
})

export const deleteAdminSchema = z.object({
  adminId: uuidSchema
})

// User management schemas
export const userSearchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(100, 'Search query too long'),
  limit: z.number().int().min(1).max(50).default(10),
  offset: z.number().int().min(0).default(0)
})

// Plugin related schemas
export const pluginOperationSchema = z.object({
  table: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid table name'),
  operation: z.enum(['select', 'insert', 'update', 'delete']),
  where: z.record(z.string(), z.any()).optional(),
  data: z.record(z.string(), z.any()).optional(),
  columns: z.array(z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid column name')).optional()
})

export const queryOptionsSchema = z.object({
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
  orderBy: z.object({
    column: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid column name'),
    ascending: z.boolean().optional()
  }).optional()
})

export const pluginExecuteSchema = z.object({
  operationName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid operation name'),
  params: z.record(z.string(), z.any()).optional()
})

// API request schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
})

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
}).merge(paginationSchema)

// Stats API schemas
export const statsQuerySchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  includeDetails: z.coerce.boolean().default(false)
})

// Environment variables validation schema
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().startsWith('eyJ', 'Invalid Supabase anon key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().startsWith('eyJ', 'Invalid Supabase service role key'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Clerk publishable key'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Clerk secret key'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/dashboard')
})

// Utility function to validate and parse request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message).join(', ')
      throw new Error(`Validation failed: ${errorMessages}`)
    }
    throw new Error('Invalid request body')
  }
}

// Utility function to validate query parameters
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(searchParams.entries())
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message).join(', ')
      throw new Error(`Query parameter validation failed: ${errorMessages}`)
    }
    throw new Error('Invalid query parameters')
  }
}

// Type exports for use in other files
export type CreateAdminInput = z.infer<typeof createAdminSchema>
export type UpdateAdminRoleInput = z.infer<typeof updateAdminRoleSchema>
export type UserSearchInput = z.infer<typeof userSearchSchema>
export type PluginOperationInput = z.infer<typeof pluginOperationSchema>
export type QueryOptionsInput = z.infer<typeof queryOptionsSchema>
export type SearchParamsInput = z.infer<typeof searchParamsSchema>
export type StatsQueryInput = z.infer<typeof statsQuerySchema>
