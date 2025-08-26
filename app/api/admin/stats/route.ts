import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { checkIsAdmin, getAllAdmins } from '@/lib/admin'
import { pluginManager } from '@/lib/plugins'
import { ensurePluginsInitialized } from '@/lib/plugins/init'

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

    // Get basic stats
    const admins = await getAllAdmins()
    
    // Ensure plugins are initialized
    await ensurePluginsInitialized()
    const registry = pluginManager.getRegistry()
    
    // Get total users from Clerk
    const client = await clerkClient()
    const usersResponse = await client.users.getUserList({ limit: 1 })
    const totalUsers = usersResponse.totalCount

    // Calculate plugin stats
    const totalPlugins = registry.plugins.size
    const healthyPlugins = Array.from(registry.health.values()).filter(h => h === 'healthy').length
    const unhealthyPlugins = totalPlugins - healthyPlugins

    // Admin role breakdown
    const adminsByRole = admins.reduce((acc, admin) => {
      acc[admin.role] = (acc[admin.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const stats = {
      users: {
        total: totalUsers,
        admins: admins.length,
        regularUsers: Math.max(0, totalUsers - admins.length)
      },
      admins: {
        total: admins.length,
        byRole: {
          super_admin: adminsByRole.super_admin || 0,
          admin: adminsByRole.admin || 0,
          moderator: adminsByRole.moderator || 0
        }
      },
      plugins: {
        total: totalPlugins,
        healthy: healthyPlugins,
        unhealthy: unhealthyPlugins,
        healthRate: totalPlugins > 0 ? Math.round((healthyPlugins / totalPlugins) * 100) : 100
      },
      system: {
        status: unhealthyPlugins === 0 ? 'healthy' : 'warning',
        uptime: process.uptime(),
        nodeVersion: process.version,
        lastUpdated: new Date().toISOString()
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching system stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system statistics' },
      { status: 500 }
    )
  }
}
