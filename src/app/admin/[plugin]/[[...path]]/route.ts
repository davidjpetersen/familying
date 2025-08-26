import { NextRequest, NextResponse } from 'next/server'
import { pluginManager } from '@/lib/plugins'
import { ensurePluginsInitialized } from '@/lib/plugins/init'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ plugin: string; path?: string[] }> }
) {
  const resolvedParams = await params
  return handlePluginRoute(request, resolvedParams, 'GET', 'admin')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ plugin: string; path?: string[] }> }
) {
  const resolvedParams = await params
  return handlePluginRoute(request, resolvedParams, 'POST', 'admin')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ plugin: string; path?: string[] }> }
) {
  const resolvedParams = await params
  return handlePluginRoute(request, resolvedParams, 'PUT', 'admin')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ plugin: string; path?: string[] }> }
) {
  const resolvedParams = await params
  return handlePluginRoute(request, resolvedParams, 'DELETE', 'admin')
}

async function handlePluginRoute(
  request: NextRequest,
  params: { plugin: string; path?: string[] },
  method: string,
  routeType: 'user' | 'admin'
) {
  const { plugin: pluginName, path = [] } = params
  
  try {
    // Ensure plugins are initialized
    await ensurePluginsInitialized()
    
    // Get plugin routes
    const pluginRoutes = pluginManager.getPluginRoutes(pluginName)
    
    if (!pluginRoutes) {
      return new NextResponse(`Plugin "${pluginName}" not found`, { status: 404 })
    }
    
    // Check if plugin is healthy
    if (!pluginManager.isHealthy(pluginName)) {
      return new NextResponse(`Plugin "${pluginName}" is unhealthy`, { status: 503 })
    }
    
    // Get the appropriate route handler
    const routes = pluginRoutes[routeType]
    if (!routes) {
      return new NextResponse(`No ${routeType} routes for plugin "${pluginName}"`, { status: 404 })
    }
    
    // Build the route path
    const routePath = path.length > 0 ? `/${path.join('/')}` : '/'
    const routeKey = `${method}:${routePath}`
    
    const handler = routes[routeKey] || routes[`*:${routePath}`] || routes['*']
    
    if (!handler) {
      return new NextResponse(`Route not found: ${method} ${routePath}`, { status: 404 })
    }
    
    // Execute the plugin route handler
    const handlerParams = {
      plugin: params.plugin,
      path: params.path?.join('/') || ''
    }
    
    return await handler(request, { params: handlerParams })
    
  } catch (error) {
    console.error(`Error handling plugin route for ${pluginName}:`, error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
