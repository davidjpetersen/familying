import {
  createAdminSchema,
  updateAdminRoleSchema,
  envSchema,
  pluginOperationSchema,
  userSearchSchema,
  paginationSchema,
} from '../validation'

describe('Validation Schemas', () => {
  describe('createAdminSchema', () => {
    it('should validate correct admin creation data', () => {
      const validData = {
        clerkUserId: 'user_123',
        email: 'admin@example.com',
        role: 'admin' as const,
      }

      const result = createAdminSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        clerkUserId: 'user_123',
        email: 'invalid-email',
        role: 'admin' as const,
      }

      const result = createAdminSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should use default role if not provided', () => {
      const dataWithoutRole = {
        clerkUserId: 'user_123',
        email: 'admin@example.com',
      }

      const result = createAdminSchema.safeParse(dataWithoutRole)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('admin')
      }
    })
  })

  describe('updateAdminRoleSchema', () => {
    it('should validate role update data', () => {
      const validData = {
        adminId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'super_admin' as const,
      }

      const result = updateAdminRoleSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID', () => {
      const invalidData = {
        adminId: 'invalid-uuid',
        role: 'admin' as const,
      }

      const result = updateAdminRoleSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('envSchema', () => {
    it('should validate required environment variables', () => {
      const validEnv = {
        NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_test',
        CLERK_SECRET_KEY: 'sk_test_test',
      }

      const result = envSchema.safeParse(validEnv)
      expect(result.success).toBe(true)
    })

    it('should reject invalid Supabase URL', () => {
      const invalidEnv = {
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_test',
        CLERK_SECRET_KEY: 'sk_test_test',
      }

      const result = envSchema.safeParse(invalidEnv)
      expect(result.success).toBe(false)
    })
  })

  describe('pluginOperationSchema', () => {
    it('should validate plugin operation', () => {
      const validOperation = {
        table: 'users',
        operation: 'select' as const,
        where: { id: 1 },
        columns: ['id', 'name', 'email'],
      }

      const result = pluginOperationSchema.safeParse(validOperation)
      expect(result.success).toBe(true)
    })

    it('should reject invalid table name', () => {
      const invalidOperation = {
        table: '123invalid',
        operation: 'select' as const,
      }

      const result = pluginOperationSchema.safeParse(invalidOperation)
      expect(result.success).toBe(false)
    })
  })

  describe('userSearchSchema', () => {
    it('should validate user search parameters', () => {
      const validSearch = {
        query: 'john',
        limit: 20,
        offset: 0,
      }

      const result = userSearchSchema.safeParse(validSearch)
      expect(result.success).toBe(true)
    })

    it('should reject empty search query', () => {
      const invalidSearch = {
        query: '',
        limit: 10,
      }

      const result = userSearchSchema.safeParse(invalidSearch)
      expect(result.success).toBe(false)
    })
  })

  describe('paginationSchema', () => {
    it('should validate pagination parameters', () => {
      const validPagination = {
        page: 2,
        limit: 25,
      }

      const result = paginationSchema.safeParse(validPagination)
      expect(result.success).toBe(true)
    })

    it('should use defaults for missing values', () => {
      const emptyPagination = {}

      const result = paginationSchema.safeParse(emptyPagination)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(10)
      }
    })
  })
})
