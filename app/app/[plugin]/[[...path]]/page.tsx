import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { pluginManager } from '@/lib/plugins';
import { ensurePluginsInitialized } from '@/lib/plugins/init';
import { NextRequest } from 'next/server';

interface PluginPageProps {
  params: Promise<{ plugin: string; path?: string[] }>;
}

export default async function PluginPage({ params }: PluginPageProps) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
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
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">Plugin Not Found</h1>
              <p className="text-muted-foreground">The plugin "{pluginName}" could not be found.</p>
            </div>
          </main>
        </div>
      );
    }

    // Check if plugin is healthy
    if (!pluginManager.isHealthy(pluginName)) {
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">Plugin Unavailable</h1>
              <p className="text-muted-foreground">The plugin "{pluginName}" is currently unavailable.</p>
            </div>
          </main>
        </div>
      );
    }

    // For now, we'll dynamically import the plugin component
    // This maintains isolation while enabling React component rendering
    let PluginComponent;
    
    try {
      // Try multiple import patterns for flexibility
      let pluginModule;
      try {
        // First try the components export
        pluginModule = await import(`@/../packages/services/${pluginName}/src/components`);
        PluginComponent = pluginModule.UserComponent;
      } catch (componentError) {
        // Fallback to direct component import
        try {
          pluginModule = await import(`@/../packages/services/${pluginName}/src/SoundscapesPage`);
          PluginComponent = pluginModule.default;
        } catch (fallbackError) {
          const componentMsg = componentError instanceof Error ? componentError.message : 'Unknown error';
          const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
          throw new Error(`Failed to load user component: ${componentMsg} | ${fallbackMsg}`);
        }
      }
    } catch (error) {
      console.error(`Failed to load plugin component for ${pluginName}:`, error);
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">Plugin Error</h1>
              <p className="text-muted-foreground">Failed to load the "{pluginName}" plugin component.</p>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <PluginComponent />
        </main>
      </div>
    );
    
  } catch (error) {
    console.error(`Error rendering plugin page for ${pluginName}:`, error);
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Internal Error</h1>
            <p className="text-muted-foreground">An error occurred while loading the plugin.</p>
          </div>
        </main>
      </div>
    );
  }
}
