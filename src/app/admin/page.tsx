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
 
        </div>
      </div>
    </div>
  );
}
