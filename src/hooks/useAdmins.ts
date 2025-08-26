import { useState, useEffect } from 'react'
import { AdminDto } from '@/application/use-cases/admin-use-cases'
import { ADMIN_ROLES, isValidAdminRole, type AdminRole } from '@/lib/constants/admin'

interface CreateAdminData {
  clerkUserId: string
  email: string
  role: string
}

interface UseAdminsResult {
  admins: AdminDto[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createAdmin: (data: CreateAdminData) => Promise<boolean>
  updateAdminRole: (id: string, role: string) => Promise<boolean>
  deactivateAdmin: (id: string) => Promise<boolean>
  activateAdmin: (id: string) => Promise<boolean>
}

// Validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateRole = (role: string): boolean => {
  return isValidAdminRole(role)
}

const validateUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Reusable validation helpers
const validateAdminId = (id: string): void => {
  if (!id?.trim()) {
    throw new Error('Admin ID is required')
  }
  
  if (!validateUUID(id.trim())) {
    throw new Error('Invalid admin ID format')
  }
}

const validateAdminRole = (role: string): void => {
  if (!role?.trim()) {
    throw new Error('Role is required')
  }
  
  if (!validateRole(role.trim())) {
    throw new Error(`Invalid role. Must be one of: ${ADMIN_ROLES.join(', ')}`)
  }
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

  const createAdmin = async (data: CreateAdminData): Promise<boolean> => {
    try {
      // Input validation
      if (!data.clerkUserId?.trim()) {
        throw new Error('Clerk User ID is required')
      }
      
      if (!data.email?.trim()) {
        throw new Error('Email is required')
      }
      
      if (!validateEmail(data.email)) {
        throw new Error('Invalid email format')
      }
      
      validateAdminRole(data.role)

      const trimmedRole = data.role.trim()

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId: data.clerkUserId.trim(),
          email: data.email.trim().toLowerCase(),
          role: trimmedRole
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create admin')
      }
      
      await fetchAdmins() // Refresh the list
      setError(null) // Clear any previous errors
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return false
    }
  }

  const updateAdminRole = async (id: string, role: string): Promise<boolean> => {
    try {
      // Input validation using helpers
      validateAdminId(id)
      validateAdminRole(role)

      const trimmedRole = role.trim()

      const response = await fetch(`/api/admin/${id.trim()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: trimmedRole }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update admin role')
      }
      
      await fetchAdmins() // Refresh the list
      setError(null) // Clear any previous errors
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return false
    }
  }

  const deactivateAdmin = async (id: string): Promise<boolean> => {
    try {
      // Input validation using helper
      validateAdminId(id)

      const response = await fetch(`/api/admin/${id.trim()}`, {
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
      setError(null) // Clear any previous errors
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      return false
    }
  }

  const activateAdmin = async (id: string): Promise<boolean> => {
    try {
      // Input validation using helper
      validateAdminId(id)

      const response = await fetch(`/api/admin/${id.trim()}`, {
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
      setError(null) // Clear any previous errors
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
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
