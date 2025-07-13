
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import NotificationDropdown from '@/components/layout/NotificationDropdown';
import UserDropdown from '@/components/layout/UserDropdown';
import DateTimeDisplay from '@/components/layout/DateTimeDisplay';
import NavigationSidebar from '@/components/layout/NavigationSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-blue-800 mb-6">{storeName}</h2>
                  <NavigationSidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-xl font-bold text-blue-800">{storeName}</h1>
          </div>

          <div className="flex items-center gap-4">
            <DateTimeDisplay />
            <NotificationDropdown />
            <UserDropdown />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <NavigationSidebar />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
