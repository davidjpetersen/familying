'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface Plugin {
  name: string
  displayName: string
  version: string
  author: string
  description: string
  health: 'healthy' | 'unhealthy' | 'unknown'
  routes: {
    user: string[]
    admin: string[]
  }
}

interface PluginsData {
  plugins: Plugin[]
  totalPlugins: number
  healthyPlugins: number
}

export default function PluginsPage() {
  const [data, setData] = useState<PluginsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlugins()
  }, [])

  const fetchPlugins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/plugins')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plugins')
    } finally {
      setLoading(false)
    }
  }

  const getHealthBadge = (health: string) => {
    const variants = {
      healthy: 'default' as const,
      unhealthy: 'destructive' as const,
      unknown: 'secondary' as const
    }
    
    return (
      <Badge variant={variants[health as keyof typeof variants] || 'secondary'}>
        {health}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading plugins...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchPlugins} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold mb-2">Plugin Management</h1>
        <p className="text-gray-600">
          Manage and monitor your application plugins
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Plugins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalPlugins || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Healthy Plugins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.healthyPlugins || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(data?.totalPlugins || 0) - (data?.healthyPlugins || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plugin List */}
      <div className="grid gap-6">
        {data?.plugins.map((plugin) => (
          <Card key={plugin.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plugin.displayName}
                    {getHealthBadge(plugin.health)}
                  </CardTitle>
                  <CardDescription>
                    {plugin.description}
                  </CardDescription>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>v{plugin.version}</div>
                  <div>by {plugin.author}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">User Routes</h4>
                  <ul className="text-sm space-y-1">
                    {plugin.routes.user.map((route, index) => (
                      <li key={index} className="font-mono text-blue-600">
                        {route}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Admin Routes</h4>
                  <ul className="text-sm space-y-1">
                    {plugin.routes.admin.map((route, index) => (
                      <li key={index} className="font-mono text-purple-600">
                        {route}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/app/${plugin.name}`, '_blank')}
                >
                  Open User Interface
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/admin/${plugin.name}`, '_blank')}
                >
                  Open Admin Interface
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {data?.plugins.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 mb-4">No plugins found</p>
              <p className="text-sm text-gray-400">
                Create plugins in the <code>packages/services/</code> directory
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
