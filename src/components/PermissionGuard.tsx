'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Permission } from '@/domain/entities/admin'

interface PermissionGuardProps {
  children: ReactNode
  permission?: Permission
  fallback?: ReactNode
  requireAdmin?: boolean
}

interface PermissionState {
  hasPermission: boolean
  isAdmin: boolean
  loading: boolean
}

export function PermissionGuard({ 
  children, 
  permission, 
  fallback = null,
  requireAdmin = false 
}: PermissionGuardProps) {
  const { user } = useUser()
  const [state, setState] = useState<PermissionState>({
    hasPermission: false,
    isAdmin: false,
    loading: true
  })

  useEffect(() => {
    async function checkPermissions() {
      if (!user) {
        setState({ hasPermission: false, isAdmin: false, loading: false })
        return
      }

      try {
        // Check if user is admin
        const adminResponse = await fetch('/api/admin/check')
        const adminResult = await adminResponse.json()
        
        const isAdmin = adminResult.success && adminResult.data?.isActive

        let hasPermission = isAdmin // Admin by default has access

        // If specific permission is required, check it
        if (permission && isAdmin) {
          const permissionResponse = await fetch(
            `/api/admin/permissions?permission=${permission}`
          )
          const permissionResult = await permissionResponse.json()
          hasPermission = permissionResult.success && permissionResult.data
        }

        setState({
          hasPermission: requireAdmin ? isAdmin : hasPermission,
          isAdmin,
          loading: false
        })
      } catch (error) {
        console.error('Permission check error:', error)
        setState({ hasPermission: false, isAdmin: false, loading: false })
      }
    }

    checkPermissions()
  }, [user, permission, requireAdmin])

  if (state.loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (!state.hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Hook for checking permissions in components
export function usePermissions() {
  const { user } = useUser()
  const [state, setState] = useState<PermissionState>({
    hasPermission: false,
    isAdmin: false,
    loading: true
  })

  const checkPermission = async (permission?: Permission): Promise<boolean> => {
    if (!user) return false

    try {
      if (permission) {
        const response = await fetch(`/api/admin/permissions?permission=${permission}`)
        const result = await response.json()
        return result.success && result.data
      } else {
        const response = await fetch('/api/admin/check')
        const result = await response.json()
        return result.success && result.data?.isActive
      }
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  }

  useEffect(() => {
    async function loadPermissions() {
      if (!user) {
        setState({ hasPermission: false, isAdmin: false, loading: false })
        return
      }

      const isAdmin = await checkPermission()
      setState({
        hasPermission: isAdmin,
        isAdmin,
        loading: false
      })
    }

    loadPermissions()
  }, [user])

  return {
    ...state,
    checkPermission,
    hasAnyPermission: (...permissions: Permission[]) => 
      Promise.all(permissions.map(checkPermission)).then(results => 
        results.some(Boolean)
      )
  }
}
