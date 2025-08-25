import { auth, currentUser } from '@clerk/nextjs/server';

export default async function GetUserIdPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not signed in</h1>
          <p>Please sign in to see your user ID</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Your Clerk User Info</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Clerk User ID
            </label>
            <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
              {userId}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use this ID to add yourself as an admin in Supabase
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Email
            </label>
            <div className="p-3 bg-muted rounded-md text-sm">
              {user.emailAddresses[0]?.emailAddress || 'No email'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Full Name
            </label>
            <div className="p-3 bg-muted rounded-md text-sm">
              {user.fullName || 'No name set'}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            SQL to Add as Admin:
          </h3>
          <code className="block text-xs bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded text-yellow-900 dark:text-yellow-100 break-all">
            INSERT INTO admins (clerk_user_id, email, role) VALUES ('{userId}', '{user.emailAddresses[0]?.emailAddress}', 'super_admin');
          </code>
        </div>
        
        <div className="mt-4 text-center">
          <a 
            href="/dashboard" 
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
