import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/admin-adapter';
import { checkIsAdminDirect } from '@/lib/admin-adapter-direct';
import { AdminLayout } from '@/components/admin/AdminLayout';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
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

  return (
    <AdminLayout requireAuth={false}>
      <AdminUsersClient />
    </AdminLayout>
  );
}
