
import { ReactNode, useState } from 'react';
import NavigationSidebar from '@/components/layout/NavigationSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        // Mobile Layout
        <div className="flex flex-col">
          <header className="bg-white border-b border-gray-200 p-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <NavigationSidebar onLinkClick={handleLinkClick} />
              </SheetContent>
            </Sheet>
          </header>
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      ) : (
        // Desktop Layout
        <div className="flex">
          <div className="w-64 fixed inset-y-0 left-0 z-50">
            <NavigationSidebar onLinkClick={handleLinkClick} />
          </div>
          <main className={cn("flex-1 ml-64 p-6")}>
            {children}
          </main>
        </div>
      )}
    </div>
  );
};

export default Layout;
