
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
      <MobileResponsiveSidebar>
        {/* Top Bar - Hidden on mobile as it's integrated into sidebar */}
        <div className="hidden md:flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200 mb-6">
          <DateTimeDisplay />
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>

        {/* Mobile Top Bar - Shows user info */}
        <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200 mb-4">
          <DateTimeDisplay />
          <div className="flex items-center gap-2">
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>

        <div className="px-2 md:px-0">
          {children}
        </div>
      </MobileResponsiveSidebar>
    </div>
  );
};

export default Layout;
