import { createClient } from '@supabase/supabase-js'

export interface HealthCheckResult {
  service: string
  status: 'operational' | 'degraded' | 'down'
  message?: string
  responseTime?: number
}

export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        service: 'Database',
        status: 'down',
        message: 'Configuration missing'
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Simple health check query
    const { error } = await supabase
      .from('admins')
      .select('id')
      .limit(1)
      .single()
    
    const responseTime = Date.now() - start
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is OK for health check
      return {
        service: 'Database',
        status: 'degraded',
        message: 'Query failed',
        responseTime
      }
    }
    
    return {
      service: 'Database',
      status: 'operational',
      responseTime
    }
  } catch (error) {
    return {
      service: 'Database',
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    }
  }
}

export async function checkApiHealth(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    // Use a lightweight internal health endpoint to avoid recursion
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/internal/health`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'X-Health-Check': 'true' // Flag to prevent recursion
      }
    })
    
    const responseTime = Date.now() - start
    
    if (!response.ok) {
      return {
        service: 'API',
        status: 'degraded',
        message: `HTTP ${response.status}`,
        responseTime
      }
    }
    
    return {
      service: 'API',
      status: 'operational',
      responseTime
    }
  } catch (error) {
    return {
      service: 'API',
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    }
  }
}

export async function checkAuthHealth(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    
    if (!clerkPublishableKey) {
      return {
        service: 'Authentication',
        status: 'down',
        message: 'Clerk configuration missing'
      }
    }
    
    // Simple connectivity check to Clerk
    const response = await fetch('https://api.clerk.dev/v1/jwks', {
      method: 'GET',
      cache: 'no-store'
    })
    
    const responseTime = Date.now() - start
    
    if (!response.ok) {
      return {
        service: 'Authentication',
        status: 'degraded',
        message: `Clerk API unavailable`,
        responseTime
      }
    }
    
    return {
      service: 'Authentication',
      status: 'operational',
      responseTime
    }
  } catch (error) {
    return {
      service: 'Authentication',
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    }
  }
}

export async function checkCdnHealth(): Promise<HealthCheckResult> {
  const start = Date.now()
  
  try {
    // Build absolute URL for CDN check
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000'
    
    if (!baseUrl || baseUrl === 'http://localhost:3000') {
      return {
        service: 'CDN',
        status: 'degraded',
        message: 'CDN check unavailable - no base URL configured',
        responseTime: Date.now() - start
      }
    }
    
    // Check CDN by fetching a static asset with absolute URL
    const assetUrl = `${baseUrl}/vercel.svg`
    const response = await fetch(assetUrl, {
      method: 'HEAD',
      cache: 'no-store'
    })
    
    const responseTime = Date.now() - start
    
    if (!response.ok) {
      return {
        service: 'CDN',
        status: 'degraded',
        message: `Static assets unavailable (${response.status})`,
        responseTime
      }
    }
    
    return {
      service: 'CDN',
      status: 'operational',
      responseTime
    }
  } catch (error) {
    return {
      service: 'CDN',
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start
    }
  }
}

export async function getAllHealthChecks(): Promise<HealthCheckResult[]> {
  try {
    const [database, api, auth, cdn] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkApiHealth(),
      checkAuthHealth(),
      checkCdnHealth()
    ])

    return [
      database.status === 'fulfilled' ? database.value : { service: 'Database', status: 'down', message: 'Check failed' },
      api.status === 'fulfilled' ? api.value : { service: 'API', status: 'down', message: 'Check failed' },
      auth.status === 'fulfilled' ? auth.value : { service: 'Authentication', status: 'down', message: 'Check failed' },
      cdn.status === 'fulfilled' ? cdn.value : { service: 'CDN', status: 'down', message: 'Check failed' }
    ]
  } catch (error) {
    console.error('Health check error:', error)
    return [
      { service: 'Database', status: 'down', message: 'Check failed' },
      { service: 'API', status: 'down', message: 'Check failed' },
      { service: 'Authentication', status: 'down', message: 'Check failed' },
      { service: 'CDN', status: 'down', message: 'Check failed' }
    ]
  }
}
