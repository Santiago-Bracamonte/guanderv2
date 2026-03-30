import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--guander-cream)' }}>
      <AdminNavbar adminName={session.name} adminRole={session.role} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
