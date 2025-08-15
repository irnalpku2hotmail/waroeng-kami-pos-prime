
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import UserDropdown from '@/components/layout/UserDropdown';
import DateTimeDisplay from '@/components/layout/DateTimeDisplay';
import NavigationSidebar from '@/components/layout/NavigationSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Fetch store settings for store name
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  // Safely extract store name and handle potential object values
  const getStoreName = (): string => {
    if (!settings?.store_name) return 'SmartPOS';
    
    const storeNameValue = settings.store_name;
    
    // Handle case where store_name might be an object with a name property
    if (typeof storeNameValue === 'object' && storeNameValue !== null) {
      if ('name' in storeNameValue && typeof storeNameValue.name === 'string') {
        return storeNameValue.name;
      }
      // If it's an object but doesn't have a name property, return default
      return 'SmartPOS';
    }
    
    // Handle case where store_name is a direct string
    if (typeof storeNameValue === 'string') {
      return storeNameValue;
    }
    
    // Convert any other type to string safely
    return String(storeNameValue) || 'SmartPOS';
  };

  const storeName = getStoreName();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile menu trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                  <h2 className="text-lg font-bold text-blue-800">{storeName}</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <NavigationSidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <h1 className="text-lg sm:text-xl font-bold text-blue-800 truncate max-w-[200px] sm:max-w-none">
              {storeName}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!isMobile && <DateTimeDisplay />}
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>
        
        {/* Mobile DateTime Display */}
        {isMobile && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <DateTimeDisplay />
          </div>
        )}
      </header>

      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-full">
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4 sm:p-6">
              <NavigationSidebar />
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content - Mobile Optimized */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
