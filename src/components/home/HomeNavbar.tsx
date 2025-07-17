
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, User, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCartWithShipping } from '@/hooks/useCartWithShipping';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import FrontendCartModal from '@/components/frontend/FrontendCartModal';
import StoreInfo from '@/components/home/StoreInfo';

const HomeNavbar = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { items } = useCartWithShipping();
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch search suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, image_url')
        .ilike('name', `%${searchQuery}%`)
        .eq('is_active', true)
        .limit(5);
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', `%${searchQuery}%`)
        .limit(3);
      
      if (productsError || categoriesError) return [];
      
      return [
        ...products.map(p => ({ ...p, type: 'product' })),
        ...categories.map(c => ({ ...c, type: 'category' }))
      ];
    },
    enabled: searchQuery.length > 0
  });

  useEffect(() => {
    setSearchSuggestions(suggestions || []);
  }, [suggestions]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === 'product') {
      navigate(`/product/${suggestion.id}`);
    } else if (suggestion.type === 'category') {
      navigate(`/search?category=${suggestion.id}`);
    }
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      {/* Store Info Bar */}
      <div className="bg-blue-50 border-b">
        <div className="container mx-auto px-4 py-2">
          <StoreInfo />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-600">
            TokoKu
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 relative">
            <div className="relative">
              <Input
                type="text"
                placeholder="Cari produk atau kategori..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2 border rounded-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>

            {/* Search Suggestions */}
            {showSuggestions && searchQuery && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-96 overflow-y-auto z-50">
                {searchSuggestions.map((suggestion) => (
                  <div
                    key={`${suggestion.type}-${suggestion.id}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    {suggestion.type === 'product' && suggestion.image_url && (
                      <img
                        src={suggestion.image_url}
                        alt={suggestion.name}
                        className="w-8 h-8 object-cover rounded mr-3"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-xs text-gray-500">
                        {suggestion.type === 'product' ? 'Produk' : 'Kategori'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Search Button for Mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSearch(searchQuery)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {totalItems}
                </Badge>
              )}
            </Button>

            {/* User */}
            <Button variant="ghost" size="icon" asChild>
              <Link to={user ? "/profile" : "/login"}>
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      <FrontendCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Overlay for suggestions */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </nav>
  );
};

export default HomeNavbar;
