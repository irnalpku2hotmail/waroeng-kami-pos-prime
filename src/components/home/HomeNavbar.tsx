
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Search, 
  History,
  UserCircle,
  Store
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface HomeNavbarProps {
  storeInfo?: StoreInfo;
  onCartClick: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch?: () => void;
}

const HomeNavbar = ({ storeInfo, onCartClick, searchTerm, onSearchChange, onSearch }: HomeNavbarProps) => {
  const { user, signOut, profile } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  // Helper function to safely extract string values from potentially object values
  const extractStringValue = (value: any, defaultValue: string): string => {
    if (!value) return defaultValue;
    
    if (typeof value === 'object' && value !== null) {
      if ('name' in value && typeof value.name === 'string') {
        return value.name;
      }
      if ('email' in value && typeof value.email === 'string') {
        return value.email;
      }
      if ('address' in value && typeof value.address === 'string') {
        return value.address;
      }
      if ('phone' in value && typeof value.phone === 'string') {
        return value.phone;
      }
      return defaultValue;
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    return String(value) || defaultValue;
  };

  const defaultStoreInfo = {
    name: 'Waroeng Kami',
    address: 'Jl. Contoh No. 123, Jakarta',
    phone: '+62 812-3456-7890',
    email: 'info@waroengkami.com'
  };

  const store = storeInfo ? {
    name: extractStringValue(storeInfo.name, defaultStoreInfo.name),
    address: extractStringValue(storeInfo.address, defaultStoreInfo.address),
    phone: extractStringValue(storeInfo.phone, defaultStoreInfo.phone),
    email: extractStringValue(storeInfo.email, defaultStoreInfo.email)
  } : defaultStoreInfo;

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
    if (onSearch) {
      onSearch();
    } else if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between py-3">
          {/* Logo and Store Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-white p-2 rounded-full shadow-md group-hover:shadow-lg transition-shadow">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold leading-tight">
                {store.name}
              </h1>
              <p className="text-blue-100 text-xs hidden md:block">
                Toko online terpercaya
              </p>
            </div>
          </Link>

          {/* Search Bar - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari produk favorit Anda..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full bg-white/90 backdrop-blur-sm border-white/20 focus:bg-white focus:border-blue-300"
                />
              </div>
            </form>
          </div>
          
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
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/order-history')}>
                    <History className="h-4 w-4 mr-2" />
                    Riwayat Pesanan
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
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white/90 backdrop-blur-sm border-white/20 focus:bg-white focus:border-blue-300"
              />
            </div>
          </form>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;
