
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import FixedSidebar from './layout/FixedSidebar';
import DateTimeDisplay from './layout/DateTimeDisplay';
import UserDropdown from './layout/UserDropdown';
import NotificationDropdown from './layout/NotificationDropdown';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only allow buyers to access the frontend, redirect staff to dashboard
  if (profile?.role === 'buyer') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar */}
      <FixedSidebar />

      {/* Main Content Area - Adjusted for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: '16rem' }}>
        {/* Fixed Top Navigation */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-30 fixed top-0 right-0 left-64 h-16">
          <div className="flex items-center justify-between px-6 py-3 h-full">
            <DateTimeDisplay />
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <UserDropdown />
            </div>
          </div>
        </header>

        {/* Main Content - Adjusted for fixed header */}
        <main className="flex-1 p-6 overflow-auto mt-16">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
