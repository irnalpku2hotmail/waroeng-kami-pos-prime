
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  UserCircle,
  Store,
  History,
  Home,
  Menu,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import EnhancedSearch from './EnhancedSearch';

interface HomeNavbarProps {
  onCartClick: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch?: () => void;
}

const HomeNavbar = ({ onCartClick, searchTerm, onSearchChange, onSearch }: HomeNavbarProps) => {
  const { user, signOut, profile } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getStoreName = (storeInfo: any) => {
    if (!storeInfo) return 'Waroeng Kami';
    
    if (typeof storeInfo === 'string') {
      try {
        const parsed = JSON.parse(storeInfo);
        return parsed.name || 'Waroeng Kami';
      } catch {
        return storeInfo;
      }
    }
    
    return storeInfo.name || 'Waroeng Kami';
  };

  const getStoreTagline = (storeInfo: any) => {
    if (!storeInfo) return 'Toko online terpercaya';
    
    if (typeof storeInfo === 'string') {
      try {
        const parsed = JSON.parse(storeInfo);
        return parsed.tagline || 'Toko online terpercaya';
      } catch {
        return 'Toko online terpercaya';
      }
    }
    
    return storeInfo.tagline || 'Toko online terpercaya';
  };

  const getLogoUrl = (storeInfo: any) => {
    if (!storeInfo) return null;
    
    if (typeof storeInfo === 'string') {
      try {
        const parsed = JSON.parse(storeInfo);
        return parsed.logo_url || null;
      } catch {
        return null;
      }
    }
    
    return storeInfo.logo_url || null;
  };

  // Get store info from settings
  const storeInfo = settings?.store_info || {};
  const storeName = getStoreName(storeInfo);
  const storeTagline = getStoreTagline(storeInfo);
  const logoUrl = getLogoUrl(storeInfo);

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between py-3">
          {/* Logo and Store Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-white p-2 rounded-full shadow-md group-hover:shadow-lg transition-shadow">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={storeName} 
                  className="h-6 w-6 object-cover rounded-full"
                />
              ) : (
                <Store className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div className="text-white hidden md:block">
              <h1 className="text-xl font-bold leading-tight">
                {storeName}
              </h1>
              <p className="text-blue-100 text-xs">
                {storeTagline}
              </p>
            </div>
          </Link>

          {/* Enhanced Search Bar */}
          <EnhancedSearch 
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onSearch={onSearch || (() => {})}
          />
          
          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-white hover:bg-white/10">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-6 h-6 rounded-full border-2 border-white/20"
                      />
                    ) : (
                      <UserCircle className="h-5 w-5" />
                    )}
                    <span className="hidden md:inline font-medium">{profile?.full_name || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/')}>
                    <Home className="h-4 w-4 mr-2" />
                    Beranda
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/order-history')}>
                    <History className="h-4 w-4 mr-2" />
                    Riwayat Pesanan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                  className="text-white hover:bg-white/10"
                >
                  Login
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/register')}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  Register
                </Button>
              </div>
            )}
            
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-white hover:bg-white/10"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <EnhancedSearch 
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onSearch={onSearch || (() => {})}
          />
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-700 rounded-lg mb-3 p-4">
            <div className="space-y-2">
              {user ? (
                <>
                  <Link 
                    to="/" 
                    className="block py-2 text-white hover:text-blue-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Beranda
                  </Link>
                  <Link 
                    to="/order-history" 
                    className="block py-2 text-white hover:text-blue-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Riwayat Pesanan
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block py-2 text-white hover:text-blue-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profil
                  </Link>
                  <hr className="border-blue-600 my-2" />
                  <button 
                    onClick={handleSignOut}
                    className="block py-2 text-white hover:text-blue-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-white hover:bg-white/10"
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      navigate('/register');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default HomeNavbar;
