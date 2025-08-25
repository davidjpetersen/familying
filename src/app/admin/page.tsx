import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Heart, 
  Shield, 
  Users, 
  Settings, 
  Database,
  Activity,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Crown
} from "lucide-react";
import { checkIsAdmin, getAllAdmins, type Admin } from '@/lib/admin';

function formatRoleName(role: Admin['role']): string {
  return role.replace('_', ' ');
}

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user is admin
  const adminStatus = await checkIsAdmin(userId);
  
  if (!adminStatus || !adminStatus.role) {
    redirect('/dashboard');
  }

  // At this point, adminStatus is guaranteed to exist and have a role
  const admin = adminStatus as Admin;

  // Get all admins for the admin table
  const allAdmins = await getAllAdmins();

  const getRoleBadgeVariant = (role: Admin['role']) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: Admin['role']) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'moderator':
        return <Users className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatRoleName = (role: string | undefined): string => {
    if (!role) return 'Unknown';
    return role.replace('_', ' ');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-primary">Familying</span>
              </Link>
              <Badge variant="destructive" className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Admin Panel</span>
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Badge variant="outline" className="flex items-center space-x-1">
                {getRoleIcon(admin.role)}
                <span className="capitalize">{formatRoleName(admin.role)}</span>
              </Badge>
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allAdmins.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active system administrators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{formatRoleName(admin.role)}</div>
                <p className="text-xs text-muted-foreground">
                  Access level and permissions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
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
