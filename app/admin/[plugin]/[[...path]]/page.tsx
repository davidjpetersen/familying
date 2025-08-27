import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/admin-adapter';
import { checkIsAdminDirect } from '@/lib/admin-adapter-direct';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { pluginManager } from '@/lib/plugins';
import { ensurePluginsInitialized } from '@/lib/plugins/init';

interface AdminPluginPageProps {
  params: Promise<{ plugin: string; path?: string[] }>;
}

export default async function AdminPluginPage({ params }: AdminPluginPageProps) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user is an admin
  let admin = await checkIsAdmin(userId);
  if (!admin) {
    admin = await checkIsAdminDirect(userId);
  }
  
  if (!admin) {
    redirect('/dashboard');
  }

  const resolvedParams = await params;
  const { plugin: pluginName, path = [] } = resolvedParams;

  try {
    // Ensure plugins are initialized
    await ensurePluginsInitialized();
    
    // Get plugin routes
    const pluginRoutes = pluginManager.getPluginRoutes(pluginName);
    
    if (!pluginRoutes) {
      return (
        <AdminLayout requireAuth={false}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Plugin Not Found</h1>
            <p className="text-muted-foreground">The plugin "{pluginName}" could not be found.</p>
          </div>
        </AdminLayout>
      );
    }

    // Check if plugin is healthy
    if (!pluginManager.isHealthy(pluginName)) {
      return (
        <AdminLayout requireAuth={false}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Plugin Unavailable</h1>
            <p className="text-muted-foreground">The plugin "{pluginName}" is currently unavailable.</p>
          </div>
        </AdminLayout>
      );
    }

    // Dynamically import the admin plugin component
    let AdminPluginComponent;
    
    try {
      const pluginModule = await import(`@/../packages/services/${pluginName}/src/AdminSoundscapesPage`);
      AdminPluginComponent = pluginModule.default;
    } catch (error) {
      console.error(`Failed to load admin plugin component for ${pluginName}:`, error);
      return (
        <AdminLayout requireAuth={false}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Plugin Error</h1>
            <p className="text-muted-foreground">Failed to load the "{pluginName}" admin plugin component.</p>
          </div>
        </AdminLayout>
      );
    }

    return (
      <AdminLayout requireAuth={false}>
        <AdminPluginComponent />
      </AdminLayout>
    );
    
  } catch (error) {
    console.error(`Error rendering admin plugin page for ${pluginName}:`, error);
    return (
      <AdminLayout requireAuth={false}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Internal Error</h1>
          <p className="text-muted-foreground">An error occurred while loading the admin plugin.</p>
        </div>
      </AdminLayout>
    );
  }
}
