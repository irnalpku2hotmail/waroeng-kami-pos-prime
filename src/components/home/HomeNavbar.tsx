
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
  UserCircle
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
}

const HomeNavbar = ({ storeInfo, onCartClick, searchTerm, onSearchChange }: HomeNavbarProps) => {
  const { user, signOut, profile } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();

  // Helper function to safely extract string values from potentially object values
  const extractStringValue = (value: any, defaultValue: string): string => {
    if (!value) return defaultValue;
    
    if (typeof value === 'object' && value !== null) {
      // Check if it has common properties like name, email, address, phone
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
      // If it's an object but doesn't have expected properties, return default
      return defaultValue;
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    // Convert any other type to string safely
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
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-gray-900">
              {store.name}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <UserCircle className="h-5 w-5" />
                    )}
                    <span className="hidden md:inline">{profile?.full_name || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                >
                  Login
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/register')}
                >
                  Register
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-4 w-4" />
              {getTotalItems() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs">
                  {getTotalItems()}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="py-3">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </form>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;
