
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, Menu, X, Home, History, LogOut, LogIn } from 'lucide-react';
import EnhancedSearch from './EnhancedSearch';

interface EnhancedNavbarProps {
  onCartClick: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

const EnhancedNavbar = ({ onCartClick, searchTerm, onSearchChange, onSearch }: EnhancedNavbarProps) => {
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fetch store name from settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;
      
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>);
      
      return settingsMap;
    }
  });

  const getStoreName = (): string => {
    if (!settings?.store_name) return 'Toko Online';
    
    const storeNameValue = settings.store_name;
    
    if (typeof storeNameValue === 'object' && storeNameValue !== null) {
      if ('name' in storeNameValue && typeof storeNameValue.name === 'string') {
        return storeNameValue.name;
      }
      return 'Toko Online';
    }
    
    if (typeof storeNameValue === 'string') {
      return storeNameValue;
    }
    
    return String(storeNameValue) || 'Toko Online';
  };

  const storeName = getStoreName();

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const profileMenuItems = [
    { icon: Home, label: 'Beranda', href: '/' },
    { icon: History, label: 'Riwayat Pesanan', href: '/order-history' },
    { icon: User, label: 'Profil', href: '/profile' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Store Name */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">
                {storeName}
              </span>
            </Link>
          </div>

          {/* Enhanced Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <EnhancedSearch
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              onSearch={onSearch}
              className="w-full"
            />
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCartClick}
              className="relative hover:bg-blue-50 rounded-full"
            >
              <ShoppingCart className="h-6 w-6" />
              {items.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                  {items.length}
                </Badge>
              )}
            </Button>

            {/* Profile Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-blue-50 rounded-full">
                    <User className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {profileMenuItems.map((item) => (
                    <DropdownMenuItem key={item.href} onClick={() => navigate(item.href)}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth/login">
                <Button variant="ghost" size="icon" className="hover:bg-blue-50 rounded-full">
                  <LogIn className="h-6 w-6" />
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden hover:bg-blue-50 rounded-full"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <EnhancedSearch
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onSearch={onSearch}
            className="w-full"
          />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white py-4">
            <div className="flex flex-col space-y-2">
              {user ? (
                <>
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Keluar
                  </button>
                </>
              ) : (
                <Link
                  to="/auth/login"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn className="mr-3 h-5 w-5" />
                  Masuk
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default EnhancedNavbar;
