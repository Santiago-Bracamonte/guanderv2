import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import AdminShell from './components/AdminShell';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  return (
    <AdminShell adminName={session.email} adminRole={session.role}>
      {children}
    </AdminShell>
  );
}
