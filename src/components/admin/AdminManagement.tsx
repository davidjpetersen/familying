'use client'

import { useState } from 'react'
import { useAdmins } from '@/hooks/useAdmins'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Users, Crown, UserCog, UserPlus, Loader2, AlertTriangle } from 'lucide-react'
import { AdminDto } from '@/application/use-cases/admin-use-cases'

function getRoleIcon(role: string) {
  switch (role) {
    case 'super_admin':
      return <Crown className="h-3 w-3" />
    case 'admin':
      return <Shield className="h-3 w-3" />
    case 'moderator':
      return <UserCog className="h-3 w-3" />
    default:
      return <Users className="h-3 w-3" />
  }
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'admin':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'moderator':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

interface CreateAdminDialogProps {
  onCreateAdmin: (data: { clerkUserId: string; email: string; role: string }) => Promise<boolean>
}

function CreateAdminDialog({ onCreateAdmin }: CreateAdminDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clerkUserId: '',
    email: '',
    role: 'moderator'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const success = await onCreateAdmin(formData)
    
    if (success) {
      setOpen(false)
      setFormData({ clerkUserId: '', email: '', role: 'moderator' })
    }
    
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Admin</DialogTitle>
          <DialogDescription>
            Add a new administrator to the system. They will receive the specified role and permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clerkUserId" className="text-right">
                Clerk User ID
              </Label>
              <Input
                id="clerkUserId"
                value={formData.clerkUserId}
                onChange={(e) => setFormData({ ...formData, clerkUserId: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminManagement() {
  const { admins, loading, error, createAdmin, updateAdminRole, deactivateAdmin, activateAdmin } = useAdmins()

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading admins...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading admins: {error}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Admin Management</CardTitle>
          <CardDescription>
            Manage system administrators and their permissions
          </CardDescription>
        </div>
        <CreateAdminDialog onCreateAdmin={createAdmin} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">{admin.email}</TableCell>
                <TableCell>
                  <Badge className={getRoleBadgeColor(admin.role)}>
                    {getRoleIcon(admin.role)}
                    <span className="ml-1 capitalize">
                      {admin.role.replace('_', ' ')}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(admin.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Select
                      value={admin.role}
                      onValueChange={(value) => updateAdminRole(admin.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {admin.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateAdmin(admin.id)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => activateAdmin(admin.id)}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {admins.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No administrators found
          </div>
        )}
      </CardContent>
    </Card>
  )
}
