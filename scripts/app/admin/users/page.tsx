'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Crown, Shield, User, UserPlus, UserMinus, Search, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

interface Admin {
  id: string
  clerk_user_id: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  created_at: string
  updated_at: string
  clerkData?: {
    firstName: string | null
    lastName: string | null
    imageUrl: string
    lastSignInAt: number | null
    createdAt: number
  } | null
}

interface ClerkUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string
  createdAt: number
  lastSignInAt: number | null
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ClerkUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ClerkUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator'>('admin')
  const [operationLoading, setOperationLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      setAdmins(result.admins)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admins')
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Failed to search users')
      }
      
      const result = await response.json()
      
      // Filter out users who are already admins
      const adminIds = new Set(admins.map(admin => admin.clerk_user_id))
      const filteredUsers = result.users.filter((user: ClerkUser) => !adminIds.has(user.id))
      
      setSearchResults(filteredUsers)
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const addAdmin = async () => {
    if (!selectedUser) return

    try {
      setOperationLoading('add')
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: selectedUser.id,
          email: selectedUser.email,
          role: selectedRole
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add admin')
      }

      await fetchAdmins()
      setIsAddDialogOpen(false)
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin')
    } finally {
      setOperationLoading(null)
    }
  }

  const updateAdminRole = async (clerkUserId: string, role: string) => {
    try {
      setOperationLoading(clerkUserId)
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId, role })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update admin role')
      }

      await fetchAdmins()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin role')
    } finally {
      setOperationLoading(null)
    }
  }

  const removeAdmin = async (clerkUserId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return

    try {
      setOperationLoading(clerkUserId)
      const response = await fetch(`/api/admin/users?clerkUserId=${clerkUserId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove admin')
      }

      await fetchAdmins()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin')
    } finally {
      setOperationLoading(null)
    }
  }

  const getRoleBadge = (role: string) => {
    const config = {
      super_admin: { icon: Crown, variant: 'destructive' as const, label: 'Super Admin' },
      admin: { icon: Shield, variant: 'default' as const, label: 'Admin' },
      moderator: { icon: User, variant: 'secondary' as const, label: 'Moderator' }
    }
    
    const { icon: Icon, variant, label } = config[role as keyof typeof config] || config.moderator
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getDisplayName = (admin: Admin) => {
    if (admin.clerkData?.firstName || admin.clerkData?.lastName) {
      return `${admin.clerkData.firstName || ''} ${admin.clerkData.lastName || ''}`.trim()
    }
    return admin.email.split('@')[0]
  }

  const getInitials = (admin: Admin) => {
    if (admin.clerkData?.firstName || admin.clerkData?.lastName) {
      return `${admin.clerkData.firstName?.[0] || ''}${admin.clerkData.lastName?.[0] || ''}`
    }
    return admin.email[0].toUpperCase()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading admin users...</p>
          </div>
        </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Users</h1>
            <p className="text-gray-600">
              Manage administrator access and permissions
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Administrator</DialogTitle>
                <DialogDescription>
                  Search for a user and assign them admin privileges
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by email or name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        searchUsers(e.target.value)
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {searchLoading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedUser?.id === user.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback>
                              {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.firstName || user.lastName 
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : user.email.split('@')[0]
                              }
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        {selectedUser?.id === user.id && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div>
                    <Label htmlFor="role">Admin Role</Label>
                    <Select value={selectedRole} onValueChange={(value: 'admin' | 'moderator') => setSelectedRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setSelectedUser(null)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={addAdmin}
                  disabled={!selectedUser || operationLoading === 'add'}
                >
                  {operationLoading === 'add' ? 'Adding...' : 'Add Admin'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-600">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>System Administrators ({admins.length})</CardTitle>
          <CardDescription>
            Users with administrative access to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={admin.clerkData?.imageUrl} />
                        <AvatarFallback>{getInitials(admin)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getDisplayName(admin)}</div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={admin.role}
                      onValueChange={(value) => updateAdminRole(admin.clerk_user_id, value)}
                      disabled={operationLoading === admin.clerk_user_id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {admin.clerkData?.lastSignInAt 
                      ? new Date(admin.clerkData.lastSignInAt).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(admin.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAdmin(admin.clerk_user_id)}
                      disabled={operationLoading === admin.clerk_user_id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-gray-500">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No administrators found</p>
                      <p className="text-sm">Add your first admin to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
