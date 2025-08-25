import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Users,
  Settings,
  Database,
  Activity,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Crown,
  UserCog
} from "lucide-react";
import { checkIsAdmin, getAllAdmins, type Admin } from '@/lib/admin';
import { AdminStats } from '@/components/admin/AdminStats';
import { Navbar } from "@/components/Navbar";function formatRoleName(role: Admin['role']): string {
  return role.replace('_', ' ');
}

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user is an admin
  const admin = await checkIsAdmin(userId);
  if (!admin) {
    redirect('/dashboard');
  }

  const allAdmins = await getAllAdmins();

  const getRoleIcon = (role: Admin['role']) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'moderator':
        return <UserCog className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: Admin['role']) => {
    switch (role) {
      case 'super_admin':
        return 'destructive' as const;
      case 'admin':
        return 'default' as const;
      case 'moderator':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar variant="admin" />

      {/* Admin Dashboard Content */}
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {admin.email}! Manage your family app from here.
            </p>
          </div>

          {/* Quick Stats */}
          <AdminStats />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Plugin Management</CardTitle>
                <CardDescription>
                  View and manage installed plugins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/plugins">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Plugins
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage admin users and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Monitoring</CardTitle>
                <CardDescription>
                  Monitor system health and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Activity className="mr-2 h-4 w-4" />
                  View Metrics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Admins Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Administrators</CardTitle>
              <CardDescription>
                Manage admin users and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAdmins.map((adminUser) => (
                    <TableRow key={adminUser.id}>
                      <TableCell className="font-medium">{adminUser.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(adminUser.role)} className="flex items-center space-x-1 w-fit">
                          {getRoleIcon(adminUser.role)}
                          <span className="capitalize">{formatRoleName(adminUser.role)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(adminUser.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(adminUser.updated_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
