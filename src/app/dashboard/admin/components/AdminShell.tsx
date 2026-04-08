'use client';

import { useState, useCallback } from 'react';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

interface AdminShellProps {
  adminName?: string;
  adminRole?: string;
  children: React.ReactNode;
}

export default function AdminShell({ adminName, adminRole, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#eef4f0',
        ['--guander-forest' as string]: '#0f3b2f',
        ['--guander-ink' as string]: '#102920',
        ['--guander-cream' as string]: '#eef4f0',
        ['--guander-mint' as string]: '#d6e7de',
        ['--guander-border' as string]: '#c7d8cf',
        ['--guander-muted' as string]: '#5a766a',
      }}
    >
      <AdminNavbar adminName={adminName} adminRole={adminRole} onMenuClick={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={closeSidebar}
          />
        )}
        <AdminSidebar open={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
