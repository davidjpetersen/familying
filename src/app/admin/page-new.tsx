'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Users,
  Settings,
  Database,
  Activity,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AdminManagement } from "@/components/admin/AdminManagement";
import { HealthCheckResult } from "@/lib/health/health-checks";

interface AdminData {
  id: string;
  email: string;
  role: string;
}

export default function AdminDashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [healthChecks, setHealthChecks] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    if (!user) {
      router.push('/sign-in');
      return;
    }

    let mounted = true;

    async function checkAdminStatus() {
      try {
        const response = await fetch('/api/admin/check');
        const result = await response.json();
        
        if (!mounted) return; // Component unmounted, don't proceed
        
        if (!result.success || !result.data?.isActive) {
          router.push('/dashboard');
          return;
        }
        
        setAdmin(result.data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (mounted) {
          router.push('/dashboard');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAdminStatus();

    return () => {
      mounted = false;
    };
  }, [user, isLoaded, router]);

  useEffect(() => {
    let mounted = true;

    async function loadHealthChecks() {
      try {
        const response = await fetch('/api/health/all');
        const result = await response.json();
        
        if (!mounted) return; // Component unmounted, don't proceed
        
        setHealthChecks(result.data || []);
      } catch (error) {
        console.error('Error loading health checks:', error);
        
        if (!mounted) return; // Component unmounted, don't proceed
        
        // Set fallback health data
        setHealthChecks([
          { service: 'API', status: 'down', message: 'Check failed' },
          { service: 'Database', status: 'down', message: 'Check failed' },
          { service: 'Authentication', status: 'down', message: 'Check failed' },
          { service: 'CDN', status: 'down', message: 'Check failed' }
        ]);
      } finally {
        if (mounted) {
          setHealthLoading(false);
        }
      }
    }

    loadHealthChecks();

    return () => {
      mounted = false;
    };
  }, []);

  const handleQuickAction = (path: string) => {
    router.push(path);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-50 text-green-600';
      case 'degraded':
        return 'bg-yellow-50 text-yellow-600';
      case 'down':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {admin.email}. You have {admin.role.replaceAll('_', ' ')} privileges.
          </p>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground">
                Uptime this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Size</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4 GB</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Management Section */}
        <div className="grid grid-cols-1 gap-6">
          <AdminManagement />
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common administrative tasks and system management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleQuickAction('/admin/users')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAction('/admin/users')}
                >
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <h3 className="font-semibold">User Management</h3>
                      <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleQuickAction('/admin/database')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAction('/admin/database')}
                >
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <h3 className="font-semibold">Database Tools</h3>
                      <p className="text-sm text-gray-600">Database maintenance and backups</p>
                    </div>
                  </div>
                </Card>

                <Card 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleQuickAction('/admin/logs')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAction('/admin/logs')}
                >
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <h3 className="font-semibold">System Logs</h3>
                      <p className="text-sm text-gray-600">View system activity and logs</p>
                    </div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    {healthLoading 
                      ? "Checking system status..." 
                      : healthChecks.every(h => h.status === 'operational')
                        ? "All systems operational. Last backup completed successfully at 3:00 AM."
                        : "Some services are experiencing issues. Check individual status below."
                    }
                  </AlertDescription>
                </Alert>
                
                {healthLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading system status...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {healthChecks.map((check, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(check.status)}`}
                      >
                        <span className="text-sm font-medium">{check.service}</span>
                        <div className="flex items-center">
                          <span className="font-semibold capitalize mr-2">
                            {check.status}
                          </span>
                          {check.responseTime && (
                            <span className="text-xs">
                              ({check.responseTime}ms)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
