import { createDatabaseHelpers, runMigration } from '../database'

// Mock Supabase with proper hoisting
jest.mock('../../supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}))

// Import the mocked supabase
import { supabaseAdmin } from '../../supabase'
const mockSupabase = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>

describe('Plugin Database Security', () => {
  let dbHelpers: ReturnType<typeof createDatabaseHelpers>

  beforeEach(() => {
    dbHelpers = createDatabaseHelpers()
    jest.clearAllMocks()
  })

  describe('secure query operations', () => {
    beforeEach(() => {
      const mockResult = {
        data: [{ id: 1, name: 'Test' }],
        error: null,
      }
      
      // Create chainable mock methods
      const mockSelect = jest.fn().mockResolvedValue(mockResult)
      const mockInsert = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockResult) })
      const mockUpdate = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockResult) })
      const mockDelete = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockResult) })
      
      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue(mockResult),
          }),
        }),
      })
      
      mockSelect.mockReturnValue({
        eq: mockEq,
      })
      
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockResult),
        }),
      })
      
      mockDelete.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(mockResult),
        }),
      })
      
      // Use type assertion to bypass strict typing for mocks
      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      })
    })

    it('should execute safe select operations', async () => {
      const result = await dbHelpers.query({
        table: 'users',
        operation: 'select',
        columns: ['id', 'name'],
        where: { active: true },
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(result).toEqual([{ id: 1, name: 'Test' }])
    })

    it('should execute safe insert operations', async () => {
      const result = await dbHelpers.query({
        table: 'users',
        operation: 'insert',
        data: { name: 'John', email: 'john@example.com' },
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(result).toEqual([{ id: 1, name: 'Test' }])
    })

    it('should execute safe update operations', async () => {
      const result = await dbHelpers.query({
        table: 'users',
        operation: 'update',
        data: { name: 'John Updated' },
        where: { id: 1 },
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(result).toEqual([{ id: 1, name: 'Test' }])
    })

    it('should execute safe delete operations', async () => {
      const result = await dbHelpers.query({
        table: 'users',
        operation: 'delete',
        where: { id: 1 },
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(result).toEqual([{ id: 1, name: 'Test' }])
    })

    it('should handle database errors gracefully', async () => {
      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      })

      await expect(dbHelpers.query({
        table: 'users',
        operation: 'select',
      })).rejects.toThrow('Database select failed: Database connection failed')
    })

    it('should require data for insert operations', async () => {
      await expect(dbHelpers.query({
        table: 'users',
        operation: 'insert',
      })).rejects.toThrow('Insert operation requires data')
    })

    it('should require data for update operations', async () => {
      await expect(dbHelpers.query({
        table: 'users',
        operation: 'update',
        where: { id: 1 },
      })).rejects.toThrow('Update operation requires data')
    })

    it('should reject unsupported operations', async () => {
      await expect(dbHelpers.query({
        table: 'users',
        operation: 'drop' as any,
      })).rejects.toThrow('Unsupported operation: drop')
    })
  })

  describe('secure execute operations', () => {
    beforeEach(() => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true },
        error: null,
      })
    })

    it('should execute allowed RPC operations', async () => {
      const result = await dbHelpers.execute('get_user_todos', {
        user_id: 123,
      })

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_todos', {
        user_id: 123,
      })
      expect(result).toEqual({ success: true })
    })

    it('should reject operations not in whitelist', async () => {
      await expect(dbHelpers.execute('dangerous_function', {}))
        .rejects.toThrow("Operation 'dangerous_function' is not allowed")
    })

    it('should handle RPC errors gracefully', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Function not found' },
      })

      await expect(dbHelpers.execute('get_user_todos', {}))
        .rejects.toThrow('RPC operation failed: Function not found')
    })
  })

  describe('runMigration security', () => {
    beforeEach(() => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: { success: true },
        error: null,
      })
    })

    it('should accept valid migration names', async () => {
      await expect(runMigration('CREATE TABLE test (id SERIAL);', 'create_test_table'))
        .resolves.toEqual({ success: true })
    })

    it('should reject invalid migration names', async () => {
      await expect(runMigration('SELECT 1;', '../invalid-name'))
        .rejects.toThrow('Invalid migration name: only alphanumeric, underscore, and dash characters allowed')
      
      await expect(runMigration('SELECT 1;', 'migration with spaces'))
        .rejects.toThrow('Invalid migration name: only alphanumeric, underscore, and dash characters allowed')
    })

    it('should reject dangerous SQL operations', async () => {
      await expect(runMigration('DROP DATABASE test;', 'dangerous_migration'))
        .rejects.toThrow('Migration contains potentially dangerous operation')
      
      await expect(runMigration('DROP SCHEMA public;', 'dangerous_migration'))
        .rejects.toThrow('Migration contains potentially dangerous operation')
      
      await expect(runMigration('TRUNCATE users;', 'dangerous_migration'))
        .rejects.toThrow('Migration contains potentially dangerous operation')
      
      await expect(runMigration('DELETE FROM users;', 'dangerous_migration'))
        .rejects.toThrow('Migration contains potentially dangerous operation')
      
      await expect(runMigration('UPDATE users SET active = false;', 'dangerous_migration'))
        .rejects.toThrow('Migration contains potentially dangerous operation')
    })

    it('should allow safe SQL operations', async () => {
      const safeSql = `
        CREATE TABLE test_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );
        DELETE FROM test_table WHERE id = 1;
        UPDATE test_table SET name = 'updated' WHERE id = 2;
      `
      
      await expect(runMigration(safeSql, 'safe_migration'))
        .resolves.toEqual({ success: true })
    })

    it('should handle migration RPC errors', async () => {
      (mockSupabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Migration failed' },
      })

      await expect(runMigration('CREATE TABLE test (id SERIAL);', 'test_migration'))
        .rejects.toThrow('Migration failed: Migration failed')
    })
  })

  describe('transaction wrapper', () => {
    it('should execute transaction function', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')
      
      const result = await dbHelpers.transaction(mockFn)
      
      expect(mockFn).toHaveBeenCalledWith(expect.any(Object))
      expect(result).toBe('success')
    })

    it('should handle transaction errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Transaction failed'))
      
      await expect(dbHelpers.transaction(mockFn))
        .rejects.toThrow('Transaction failed')
    })
  })
})
