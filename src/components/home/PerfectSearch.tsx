
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchSuggestion {
  type: 'product' | 'category';
  id: string;
  name: string;
  image_url?: string;
}

interface PerfectSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
}

const PerfectSearch = ({ searchTerm, onSearchChange, onSearch }: PerfectSearchProps) => {
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch active products for suggestions
  const { data: productsData } = useQuery({
    queryKey: ['search-products', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url')
        .ilike('name', `%${debouncedSearchTerm}%`)
        .eq('is_active', true)
        .limit(5);

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return data || [];
    },
    enabled: debouncedSearchTerm.length >= 2
  });

  // Fetch categories for suggestions
  const { data: categoriesData } = useQuery({
    queryKey: ['search-categories', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon_url')
        .ilike('name', `%${debouncedSearchTerm}%`)
        .limit(3);

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data || [];
    },
    enabled: debouncedSearchTerm.length >= 2
  });

  // Fetch best selling products
  const { data: bestSellingData } = useQuery({
    queryKey: ['best-selling-small'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, image_url, selling_price,
          transaction_items(quantity)
        `)
        .eq('is_active', true)
        .limit(4);

      if (error) {
        console.error('Error fetching best selling products:', error);
        return [];
      }

      // Calculate total sold and sort
      const productsWithSold = data?.map(product => ({
        ...product,
        totalSold: product.transaction_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
      })) || [];

      return productsWithSold.sort((a, b) => b.totalSold - a.totalSold);
    }
  });

  // Combine suggestions
  const suggestions: SearchSuggestion[] = [
    ...(categoriesData || []).map(c => ({
      type: 'category' as const,
      id: c.id,
      name: c.name,
      image_url: c.icon_url
    })),
    ...(productsData || []).map(p => ({
      type: 'product' as const,
      id: p.id,
      name: p.name,
      image_url: p.image_url
    }))
  ];

  // Show suggestions logic
  useEffect(() => {
    const shouldShow = isFocused && 
      (debouncedSearchTerm.length >= 2 || suggestions.length > 0 || (bestSellingData && bestSellingData.length > 0));
    
    setShowSuggestions(shouldShow);
  }, [isFocused, debouncedSearchTerm, suggestions, bestSellingData]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    setIsFocused(false);
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    setIsFocused(false);
    
    if (suggestion.type === 'category') {
      navigate(`/search?category=${encodeURIComponent(suggestion.name)}`);
    } else {
      navigate(`/product/${suggestion.id}`);
    }
  };

  const handleBestSellingClick = (productId: string) => {
    setShowSuggestions(false);
    setIsFocused(false);
    navigate(`/product/${productId}`);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
  };

  const clearSearch = () => {
    onSearchChange('');
    setShowSuggestions(false);
  };

  return (
    <div className="flex-1 max-w-2xl mx-8 hidden md:block" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className={`relative transition-all duration-300 ${isFocused ? 'scale-105' : ''}`}>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors duration-200" />
          
          <Input
            type="search"
            placeholder="Cari produk, kategori, atau brand..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className={`pl-12 pr-20 py-3 w-full transition-all duration-300 rounded-2xl shadow-lg ${
              isFocused 
                ? 'bg-white border-2 border-blue-400 shadow-xl ring-4 ring-blue-100' 
                : 'bg-white/95 backdrop-blur-sm border-white/20 hover:bg-white hover:border-blue-300'
            }`}
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <Button
                type="button"
                onClick={clearSearch}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Search Suggestions */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Search Results */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Hasil Pencarian
                </div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.type}-${suggestion.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer rounded-xl transition-all duration-200 group"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg overflow-hidden">
                      {suggestion.image_url ? (
                        <img 
                          src={suggestion.image_url} 
                          alt={suggestion.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={suggestion.type === 'category' ? 'default' : 'outline'} 
                          className={`text-xs font-medium px-2 py-1 ${
                            suggestion.type === 'category' 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {suggestion.type === 'category' ? 'Kategori' : 'Produk'}
                        </Badge>
                      </div>
                      <span className="text-gray-900 font-medium group-hover:text-blue-700 transition-colors">
                        {suggestion.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Best Selling Products - Small Size */}
            {bestSellingData && bestSellingData.length > 0 && (
              <div className="border-t border-gray-100 p-3">
                <div className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  <TrendingUp className="h-4 w-4" />
                  Produk Terlaris
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {bestSellingData.slice(0, 4).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleBestSellingClick(product.id)}
                      className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-700">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Rp {new Intl.NumberFormat('id-ID').format(product.selling_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick search actions */}
            {searchTerm.trim() && (
              <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                <button
                  onClick={handleSearch}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200"
                >
                  <Search className="h-4 w-4" />
                  Cari "{searchTerm}"
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default PerfectSearch;
