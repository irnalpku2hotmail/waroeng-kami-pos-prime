import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceSearch from '@/components/VoiceSearch';
import BarcodeScanner from '@/components/BarcodeScanner';
import SmartSearchSuggestions from '@/components/home/SmartSearchSuggestions';


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
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Save search to history
  const saveSearchHistory = async (term: string) => {
    if (!user || !term.trim()) return;
    try {
      await supabase.from('search_history').insert({
        user_id: user.id,
        search_term: term.trim()
      });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const handleSearch = useCallback((query?: string) => {
    const searchQuery = query || searchTerm;
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery.trim());
      const params = new URLSearchParams();
      params.set('q', searchQuery.trim());
      if (selectedCategory && selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      navigate(`/search?${params.toString()}`);
      setShowSuggestions(false);
    }
  }, [searchTerm, selectedCategory, navigate, user]);

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    try {
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .maybeSingle();

      if (product) {
        navigate(`/product/${product.id}`);
      } else {
        onSearchChange(barcode);
        handleSearch(barcode);
      }
    } catch {
      onSearchChange(barcode);
      handleSearch(barcode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
      return;
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Close on click outside
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
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-24 bg-white border-0 focus:ring-2 focus:ring-[#03AC0E]/30 transition-colors h-10 rounded-lg"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5">
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
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

      {/* Smart Suggestions */}
      <SmartSearchSuggestions
        searchTerm={debouncedTerm}
        showSuggestions={showSuggestions}
        selectedIndex={selectedIndex}
        onClose={() => { setShowSuggestions(false); setSelectedIndex(-1); }}
        onSelectProduct={(id) => { navigate(`/product/${id}`); setShowSuggestions(false); }}
        onSearch={(q) => { onSearchChange(q); handleSearch(q); }}
        selectedCategory={selectedCategory}
      />
    </div>
  );
};

export default EnhancedHomeSearch;
