import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { pluginManager } from '@/lib/plugins'
import { ensurePluginsInitialized } from '@/lib/plugins/init'
import { checkIsAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    const admin = await checkIsAdmin(userId)
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Ensure plugins are initialized
    await ensurePluginsInitialized()

    // Get plugin registry
    const registry = pluginManager.getRegistry()
    
    const pluginList = Array.from(registry.plugins.entries()).map(([name, plugin]) => ({
      name,
      displayName: plugin.manifest.displayName,
      version: plugin.manifest.version,
      author: plugin.manifest.author,
      description: plugin.manifest.description,
      health: registry.health.get(name),
      routes: plugin.manifest.routes
    }))

    return NextResponse.json({
      plugins: pluginList,
      totalPlugins: pluginList.length,
      healthyPlugins: pluginList.filter(p => p.health === 'healthy').length
    })

  } catch (error) {
    console.error('Error fetching plugins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugins' },
      { status: 500 }
    )
  }
}
