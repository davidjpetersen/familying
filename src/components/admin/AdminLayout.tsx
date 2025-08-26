import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/admin-adapter';
import { checkIsAdminDirect } from '@/lib/admin-adapter-direct';
import { AdminNavbar } from '@/components/admin/AdminNavbar';

interface AdminLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  hideNavbar?: boolean;
}

export async function AdminLayout({ children, requireAuth = true, hideNavbar = false }: AdminLayoutProps) {
  if (requireAuth) {
    const { userId } = await auth();
    
    if (!userId) {
      redirect('/sign-in');
    }

    // Check if user is an admin - using direct method as fallback  
    let admin = await checkIsAdmin(userId);
    if (!admin) {
      // Try direct method as fallback
      admin = await checkIsAdminDirect(userId);
    }
    
    if (!admin) {
      redirect('/dashboard');
    }

    return (
      <div className="min-h-screen bg-background">
        {!hideNavbar && <AdminNavbar userRole={admin.role} />}
        <main className={hideNavbar ? "" : "container mx-auto px-4 py-6"}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!hideNavbar && <AdminNavbar />}
      <main className={hideNavbar ? "" : "container mx-auto px-4 py-6"}>
        {children}
      </main>
    </div>
  );
}
