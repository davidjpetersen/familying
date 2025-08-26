import { auth, currentUser } from '@clerk/nextjs/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, User } from 'lucide-react';
import { AdminSetupClient } from './AdminSetupClient';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default async function AdminSetupPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Signed In</CardTitle>
            <CardDescription>Please sign in to set up admin access</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout requireAuth={false} hideNavbar={true}>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Admin Setup
            </CardTitle>
            <CardDescription>
              Set up admin access for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This page helps you add yourself as an admin user. You'll need admin privileges to access the admin dashboard.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Clerk User ID
                </label>
                <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {userId}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email
                </label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {user.emailAddresses[0]?.emailAddress || 'No email'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {user.fullName || 'No name set'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Manual SQL (if needed):
                </h3>
                <code className="block text-xs bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded text-yellow-900 dark:text-yellow-100 break-all">
                  INSERT INTO admins (clerk_user_id, email, role) VALUES ('{userId}', '{user.emailAddresses[0]?.emailAddress}', 'super_admin');
                </code>
              </div>

              <div className="space-y-2">
                <AdminSetupClient userInfo={{ userId, email: user.emailAddresses[0]?.emailAddress }} />
                <Button variant="outline" asChild className="w-full">
                  <a href="/dashboard">
                    Back to Dashboard
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
