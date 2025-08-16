
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MobileResponsiveSidebar from './layout/MobileResponsiveSidebar';
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
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <DateTimeDisplay />
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="pt-16">
        <MobileResponsiveSidebar>
          <div className="px-2 md:px-6 py-6">
            {children}
          </div>
        </MobileResponsiveSidebar>
      </div>
    </div>
  );
};

export default Layout;
