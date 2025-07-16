
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

interface HomeNavbarProps {
  onCartClick: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch?: () => void;
}

interface SearchSuggestion {
  type: 'product' | 'category';
  id: string;
  name: string;
}

const HomeNavbar = ({ onCartClick, searchTerm, onSearchChange, onSearch }: HomeNavbarProps) => {
  const { user, signOut, profile } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search suggestions query
  const { data: searchData } = useQuery({
    queryKey: ['search-suggestions', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return { products: [], categories: [] };

      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, name')
          .ilike('name', `%${searchTerm}%`)
          .limit(5),
        supabase
          .from('categories')
          .select('id, name')
          .ilike('name', `%${searchTerm}%`)
          .limit(3)
      ]);

      return {
        products: productsResult.data || [],
        categories: categoriesResult.data || []
      };
    },
    enabled: searchTerm.length >= 2
  });

  useEffect(() => {
    if (searchData && searchData.products && searchData.categories) {
      const productSuggestions: SearchSuggestion[] = searchData.products.map(p => ({
        type: 'product',
        id: p.id,
        name: p.name
      }));

      const categorySuggestions: SearchSuggestion[] = searchData.categories.map(c => ({
        type: 'category',
        id: c.id,
        name: c.name
      }));

      setSuggestions([...categorySuggestions, ...productSuggestions]);
    }
  }, [searchData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setShowSuggestions(false);
    if (onSearch) {
      onSearch();
    } else if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    if (suggestion.type === 'category') {
      navigate(`/search?category=${suggestion.id}`);
    } else {
      onSearchChange(suggestion.name);
      navigate(`/search?q=${encodeURIComponent(suggestion.name)}`);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    setShowSuggestions(value.length >= 2);
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
                Waroeng Kami
              </h1>
              <p className="text-blue-100 text-xs hidden md:block">
                Toko online terpercaya
              </p>
            </div>
          </Link>

          {/* Search Bar - Hidden on mobile, shown on desktop */}
          <div className="hidden md:block flex-1 max-w-2xl mx-8" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Cari produk atau kategori..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  className="pl-10 pr-4 py-2 w-full bg-white/90 backdrop-blur-sm border-white/20 focus:bg-white focus:border-blue-300"
                />
              </div>

              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.type}-${suggestion.id}`}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.type === 'category' ? (
                        <Badge variant="secondary" className="text-xs">Kategori</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Produk</Badge>
                      )}
                      <span className="text-gray-900">{suggestion.name}</span>
                    </div>
                  ))}
                </div>
              )}
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
        <div className="md:hidden pb-3" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Cari produk atau kategori..."
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className="pl-10 pr-4 py-2 w-full bg-white/90 backdrop-blur-sm border-white/20 focus:bg-white focus:border-blue-300"
              />
            </div>

            {/* Mobile Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.id}`}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.type === 'category' ? (
                      <Badge variant="secondary" className="text-xs">Kategori</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Produk</Badge>
                    )}
                    <span className="text-gray-900">{suggestion.name}</span>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;
