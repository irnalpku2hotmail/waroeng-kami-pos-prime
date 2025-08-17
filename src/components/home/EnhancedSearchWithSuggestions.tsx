
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, Package, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchSuggestion {
  type: 'product' | 'category';
  id: string;
  name: string;
  image_url?: string;
  category_name?: string;
}

interface EnhancedSearchWithSuggestionsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
}

const EnhancedSearchWithSuggestions = ({ 
  searchTerm, 
  onSearchChange, 
  onSearch 
}: EnhancedSearchWithSuggestionsProps) => {
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch product suggestions
  const { data: productSuggestions = [] } = useQuery({
    queryKey: ['product-suggestions', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          image_url,
          categories (id, name)
        `)
        .ilike('name', `%${debouncedSearchTerm}%`)
        .eq('is_active', true)
        .limit(5);

      if (error) throw error;

      return (data || []).map(product => ({
        type: 'product' as const,
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        category_name: product.categories?.name
      }));
    },
    enabled: debouncedSearchTerm.length >= 2
  });

  // Fetch category suggestions
  const { data: categorySuggestions = [] } = useQuery({
    queryKey: ['category-suggestions', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon_url')
        .ilike('name', `%${debouncedSearchTerm}%`)
        .limit(3);

      if (error) throw error;

      return (data || []).map(category => ({
        type: 'category' as const,
        id: category.id,
        name: category.name,
        image_url: category.icon_url
      }));
    },
    enabled: debouncedSearchTerm.length >= 2
  });

  const allSuggestions = [...categorySuggestions, ...productSuggestions];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || allSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          handleSuggestionClick(allSuggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      onSearch();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    if (suggestion.type === 'category') {
      navigate(`/search?category=${encodeURIComponent(suggestion.name)}`);
    } else {
      navigate(`/product/${suggestion.id}`);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex-1 max-w-lg mx-4" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          
          <Input
            type="search"
            placeholder="Cari produk atau kategori..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-20 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-colors"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <Button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setShowSuggestions(false);
                }}
                className="p-1 h-6 w-6 hover:bg-gray-200 text-gray-500"
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              type="submit"
              className="h-8 px-3 text-blue-600 hover:bg-blue-50"
              size="sm"
              variant="ghost"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && allSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto mt-1">
            <div className="p-2">
              {/* Category Suggestions */}
              {categorySuggestions.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Kategori
                  </div>
                  {categorySuggestions.map((suggestion, index) => (
                    <div
                      key={`category-${suggestion.id}`}
                      className={`flex items-center gap-3 px-3 py-2 hover:bg-blue-50 cursor-pointer rounded-lg transition-colors ${
                        index === selectedIndex ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Tag className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <Badge variant="default" className="bg-blue-100 text-blue-700 text-xs mb-1">
                          Kategori
                        </Badge>
                        <div className="font-medium text-gray-900">{suggestion.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Product Suggestions */}
              {productSuggestions.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Produk
                  </div>
                  {productSuggestions.map((suggestion, index) => {
                    const adjustedIndex = index + categorySuggestions.length;
                    return (
                      <div
                        key={`product-${suggestion.id}`}
                        className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors ${
                          adjustedIndex === selectedIndex ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {suggestion.image_url ? (
                            <img
                              src={suggestion.image_url}
                              alt={suggestion.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs mb-1">
                            Produk
                          </Badge>
                          <div className="font-medium text-gray-900 text-sm">{suggestion.name}</div>
                          {suggestion.category_name && (
                            <div className="text-xs text-gray-500">{suggestion.category_name}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Search all results */}
              {searchTerm.trim() && (
                <div className="border-t mt-2 pt-2">
                  <button
                    onClick={handleSearch}
                    className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Lihat semua hasil untuk "{searchTerm}"
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default EnhancedSearchWithSuggestions;
