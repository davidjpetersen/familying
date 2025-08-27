import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PluginContext } from '../../../../src/lib/plugins/types'
import { register, deregister } from '../src/index'

// Mock dependencies
const mockContext: PluginContext = {
  manifest: {
    name: 'summaries',
    displayName: 'Book Summaries',
    version: '0.1.0',
    author: 'David Petersen',
    description: 'Enhanced book summaries of parenting classics',
    routes: { user: [], admin: [] },
    migrations: []
  },
  config: {},
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  },
  auth: {
    requireAuth: vi.fn(),
    withRoles: vi.fn(),
    isAdmin: vi.fn(),
    hasRole: vi.fn(),
    assertRole: vi.fn()
  },
  db: {
    execute: vi.fn(),
    query: vi.fn(),
    transaction: vi.fn()
  }
}

describe('summaries Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register successfully', async () => {
    const routes = await register(mockContext)
    
    expect(routes).toBeDefined()
    expect(routes.user).toBeDefined()
    expect(routes.admin).toBeDefined()
    expect(mockContext.logger.info).toHaveBeenCalledWith('Registering summaries plugin')
  })

  it('should deregister successfully', async () => {
    await deregister(mockContext)
    
    expect(mockContext.logger.info).toHaveBeenCalledWith('Deregistering summaries plugin')
  })

  // Add more tests here
})
