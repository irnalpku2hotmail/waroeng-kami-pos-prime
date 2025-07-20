
import { useState, useEffect } from 'react';
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
import PerfectSearch from './PerfectSearch';

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Get store info from settings
  const storeInfo = settings?.store_info || {};
  const storeName = settings?.store_name?.name || 'Waroeng Kami';
  const storeTagline = settings?.store_tagline?.tagline || 'Toko online terpercaya';
  const logoUrl = settings?.store_logo?.url || null;

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-xl border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between py-4">
          {/* Logo and Store Name with Enhanced Design */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative">
              <div className="bg-white p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={storeName} 
                    className="h-8 w-8 object-cover rounded-lg"
                  />
                ) : (
                  <Store className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-white hidden md:block">
              <h1 className="text-2xl font-bold leading-tight tracking-wide">
                {storeName}
              </h1>
              <p className="text-blue-100 text-sm font-medium">
                {storeTagline}
              </p>
            </div>
          </Link>

          {/* Perfect Search Bar for Desktop */}
          <PerfectSearch 
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onSearch={handleSearch}
          />
          
          {/* Enhanced User Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-3 text-white hover:bg-white/10 px-4 py-2 rounded-xl transition-all duration-300">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-8 h-8 rounded-full border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <UserCircle className="h-5 w-5" />
                      </div>
                    )}
                    <span className="hidden md:inline font-semibold">{profile?.full_name || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-md border-0 shadow-xl rounded-xl">
                  <DropdownMenuItem onClick={() => navigate('/')} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-lg">
                    <Home className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Beranda</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/order-history')} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-lg">
                    <History className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Riwayat Pesanan</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                  className="text-white hover:bg-white/10 font-semibold px-4 py-2 rounded-xl transition-all duration-300"
                >
                  Login
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/register')}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-4 py-2 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  Register
                </Button>
              </div>
            )}
            
            {/* Enhanced Cart Button */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-white hover:bg-white/10 p-3 rounded-xl transition-all duration-300 hover:scale-105"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600 rounded-full animate-bounce">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>

            {/* Enhanced Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-white/10 p-3 rounded-xl transition-all duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <PerfectSearch 
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onSearch={handleSearch}
          />
        </div>

        {/* Enhanced Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-md rounded-2xl mb-4 p-4 shadow-xl">
            <div className="space-y-3">
              {user ? (
                <>
                  <Link 
                    to="/" 
                    className="flex items-center gap-3 py-3 px-4 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Beranda</span>
                  </Link>
                  <Link 
                    to="/order-history" 
                    className="flex items-center gap-3 py-3 px-4 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <History className="h-5 w-5" />
                    <span className="font-medium">Riwayat Pesanan</span>
                  </Link>
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-3 py-3 px-4 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Profil</span>
                  </Link>
                  <hr className="border-white/20 my-2" />
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-3 py-3 px-4 text-white hover:bg-red-500/20 rounded-xl transition-all duration-300 w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-white hover:bg-white/10 font-medium py-3 rounded-xl"
                  >
                    Login
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      navigate('/register');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 rounded-xl"
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
