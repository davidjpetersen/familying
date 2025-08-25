import { useState, useEffect } from 'react'
import { AdminDto } from '@/application/use-cases/admin-use-cases'

interface UseAdminsResult {
  admins: AdminDto[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createAdmin: (data: { clerkUserId: string; email: string; role: string }) => Promise<boolean>
  updateAdminRole: (id: string, role: string) => Promise<boolean>
  deactivateAdmin: (id: string) => Promise<boolean>
  activateAdmin: (id: string) => Promise<boolean>
}

export function useAdmins(): UseAdminsResult {
  const [admins, setAdmins] = useState<AdminDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch admins')
      }
      
      setAdmins(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createAdmin = async (data: { clerkUserId: string; email: string; role: string }): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create admin')
      }
      
      await fetchAdmins() // Refresh the list
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  const updateAdminRole = async (id: string, role: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update admin role')
      }
      
      await fetchAdmins() // Refresh the list
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  const deactivateAdmin = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'deactivate' }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to deactivate admin')
      }
      
      await fetchAdmins() // Refresh the list
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  const activateAdmin = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'activate' }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to activate admin')
      }
      
      await fetchAdmins() // Refresh the list
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  return {
    admins,
    loading,
    error,
    refetch: fetchAdmins,
    createAdmin,
    updateAdminRole,
    deactivateAdmin,
    activateAdmin,
  }
}
