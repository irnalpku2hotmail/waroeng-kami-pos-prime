
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

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile, setCollapsed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role === 'buyer') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'text-sm' : ''}`}>
      <CollapsibleSidebar />

      <div className={`${collapsed ? 'ml-[68px]' : 'ml-60'} ${isMobile ? '!ml-0' : ''} flex flex-col min-h-screen transition-all duration-300 ease-in-out`}>
        {/* Top Header */}
        <header className={`bg-card/80 backdrop-blur-sm border-b border-border fixed top-0 right-0 ${isMobile ? 'left-0' : collapsed ? 'left-[68px]' : 'left-60'} z-10 transition-all duration-300 ease-in-out`}>
          <div className="flex items-center justify-between px-4 md:px-6 h-[60px]">
            <div className={isMobile ? 'ml-12' : ''}>
              <DateTimeDisplay />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <NotificationDropdown />
              <UserDropdown />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`flex-1 px-4 md:px-6 py-5 overflow-auto mt-[60px] ${isMobile ? 'pb-16' : ''}`}>
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-[2px] z-30 transition-opacity duration-300"
          onClick={() => setCollapsed(true)}
        />
      )}

      <AIAgentButton variant="floating" />
    </div>
  );
};

export default Layout;
