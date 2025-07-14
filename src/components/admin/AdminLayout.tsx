import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavigation from './AdminNavigation';
import UserMenu from '../UserMenu';

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Navigation */}
      <AdminNavigation />

      {/* Main Content */}
      <main className="p-6">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AdminLayout;