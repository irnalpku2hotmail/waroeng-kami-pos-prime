
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Package, ShoppingCart, Search, User, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FrontendHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const FrontendHeader = ({ searchTerm, setSearchTerm }: FrontendHeaderProps) => {
  const { user, signOut } = useAuth();
  const { items } = useCart();

  // Fetch store settings
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['store_name', 'store_phone', 'store_email', 'store_address']);
      
      if (error) throw error;
      
      const settings: Record<string, any> = {};
      data?.forEach(setting => {
        settings[setting.key] = setting.value;
      });
      
      return settings;
    }
  });

  const storeName = storeSettings?.store_name?.name || 'Waroeng Kami';

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Store Name */}
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {!user ? (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => window.location.href = '/auth/login'}>
                  Login
                </Button>
                <Button onClick={() => window.location.href = '/auth/register'}>
                  Register
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {items.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {items.length}
                    </Badge>
                  )}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontendHeader;
