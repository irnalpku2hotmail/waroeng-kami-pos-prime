
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CollapsibleSidebar from './layout/CollapsibleSidebar';
import DateTimeDisplay from './layout/DateTimeDisplay';
import UserDropdown from './layout/UserDropdown';
import NotificationDropdown from './layout/NotificationDropdown';
import { AIAgentButton } from './ai/AIAgentButton';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const { collapsed, setCollapsed } = useSidebarContext();
  const isMobile = useIsMobile();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile, setCollapsed]);

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
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'text-sm' : ''}`}>
      {/* Sidebar */}
      <CollapsibleSidebar />

      {/* Main Content Area - with left margin for sidebar */}
      <div className={`${collapsed ? 'ml-16' : 'ml-56'} ${isMobile ? 'ml-0' : ''} flex flex-col min-h-screen transition-all duration-300`}>
        {/* Fixed Top Navigation */}
        <header className={`bg-white border-b border-gray-200 shadow-sm fixed top-0 right-0 ${isMobile ? 'left-0' : collapsed ? 'left-16' : 'left-56'} z-10 transition-all duration-300`}>
          <div className="flex items-center justify-between px-2 md:px-4 py-2 md:py-3">
            {/* On mobile, add left margin to avoid overlap with hamburger menu */}
            <div className={isMobile ? 'ml-12' : ''}>
              <DateTimeDisplay />
            </div>
            {/* Notification and Profile on the right */}
            <div className="flex items-center gap-1 md:gap-4">
              <NotificationDropdown />
              <UserDropdown />
            </div>
          </div>
        </header>

        {/* Main Content - responsive padding and margin */}
        <main className={`flex-1 p-2 md:p-4 overflow-auto mt-[52px] md:mt-[60px] ${isMobile ? 'pb-16' : ''}`}>
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* AI Agent Floating Button */}
      <AIAgentButton variant="floating" />
    </div>
  );
};

export default Layout;
