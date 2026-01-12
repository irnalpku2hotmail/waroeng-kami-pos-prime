
import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, X, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SlidersHorizontal, Check } from 'lucide-react';
import VoiceSearch from '@/components/VoiceSearch';
import BarcodeScanner from '@/components/BarcodeScanner';

interface EnhancedHomeSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
}

const EnhancedHomeSearch = ({ 
  searchTerm, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange 
}: EnhancedHomeSearchProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch search suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', searchTerm, selectedCategory],
    queryFn: async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) return [];

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          image_url,
          selling_price,
          current_stock,
          categories (id, name)
        `)
        .eq('is_active', true)
        .limit(6);

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      query = query.ilike('name', `%${searchTerm}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2
  });

  const handleSearch = (query?: string) => {
    const searchQuery = query || searchTerm;
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('q', searchQuery.trim());
      if (selectedCategory && selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      navigate(`/search?${params.toString()}`);
      setShowSuggestions(false);
    }
  };

  // Handle barcode scan - search for product by barcode
  const handleBarcodeScan = async (barcode: string) => {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (product) {
        // Navigate directly to product detail
        navigate(`/product/${product.id}`);
      } else {
        // If no product found, search by barcode text
        onSearchChange(barcode);
        handleSearch(barcode);
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
      // Fallback to text search
      onSearchChange(barcode);
      handleSearch(barcode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          navigate(`/product/${suggestions[selectedIndex].id}`);
          setShowSuggestions(false);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
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
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="flex gap-2">
        {/* Category Filter - Minimal Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className={`h-10 w-10 flex-shrink-0 ${selectedCategory && selectedCategory !== 'all' ? 'bg-blue-50 border-blue-300 text-blue-600' : ''}`}
              aria-label="Filter kategori"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem 
              onClick={() => onCategoryChange('all')}
              className="flex items-center justify-between"
            >
              Semua Kategori
              {(!selectedCategory || selectedCategory === 'all') && <Check className="h-4 w-4 text-blue-600" />}
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem 
                key={category.id} 
                onClick={() => onCategoryChange(category.id)}
                className="flex items-center justify-between"
              >
                {category.name}
                {selectedCategory === category.id && <Check className="h-4 w-4 text-blue-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
            className="pl-10 pr-24 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-colors"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5">
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200"
                onClick={() => {
                  onSearchChange('');
                  setShowSuggestions(false);
                }}
                aria-label="Hapus pencarian"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <VoiceSearch 
              onVoiceResult={(text) => {
                onSearchChange(text);
                setShowSuggestions(true);
              }} 
            />
            <BarcodeScanner onScanSuccess={handleBarcodeScan} />
          </div>
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((product, index) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    navigate(`/product/${product.id}`);
                    setShowSuggestions(false);
                  }}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {product.categories && (
                        <Badge variant="secondary" className="text-xs">
                          {product.categories.name}
                        </Badge>
                      )}
                      <span className="text-xs text-blue-600 font-semibold">
                        {formatPrice(product.selling_price)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Stok: {product.current_stock}
                  </div>
                </div>
              ))}
            </div>
            
            {searchTerm && (
              <div className="border-t mt-2 pt-2">
                <button
                  onClick={() => handleSearch()}
                  className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Lihat semua hasil untuk "{searchTerm}"
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedHomeSearch;
