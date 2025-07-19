
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Mic, MicOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchSuggestion {
  type: 'product' | 'category';
  id: string;
  name: string;
}

interface EnhancedSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
}

const EnhancedSearch = ({ searchTerm, onSearchChange, onSearch }: EnhancedSearchProps) => {
  const navigate = useNavigate();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Separate queries for products and categories
  const { data: productsData } = useQuery({
    queryKey: ['search-products', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', `%${debouncedSearchTerm}%`)
        .eq('is_active', true)
        .limit(6);

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return data || [];
    },
    enabled: debouncedSearchTerm.length >= 2
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['search-categories', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .ilike('name', `%${debouncedSearchTerm}%`)
        .limit(4);

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      return data || [];
    },
    enabled: debouncedSearchTerm.length >= 2
  });

  // Combine and format suggestions
  useEffect(() => {
    const productSuggestions: SearchSuggestion[] = (productsData || []).map(p => ({
      type: 'product' as const,
      id: p.id,
      name: p.name
    }));

    const categorySuggestions: SearchSuggestion[] = (categoriesData || []).map(c => ({
      type: 'category' as const,
      id: c.id,
      name: c.name
    }));

    setSuggestions([...categorySuggestions, ...productSuggestions]);
  }, [productsData, categoriesData]);

  // Show suggestions logic - Fixed the boolean logic
  useEffect(() => {
    const shouldShow = isFocused && 
      debouncedSearchTerm.length >= 2 && 
      suggestions.length > 0;
    
    setShowSuggestions(shouldShow);
  }, [isFocused, debouncedSearchTerm, suggestions]);

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

  // Voice search setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'id-ID';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange(transcript);
        setIsListening(false);
        // Auto focus to results after voice input
        setTimeout(() => {
          handleSearch();
        }, 500);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [onSearchChange]);

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert('Voice search tidak didukung di browser ini');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

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
            
            <Button
              type="button"
              onClick={handleVoiceSearch}
              className={`p-2 rounded-full transition-all duration-200 ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              size="sm"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${suggestion.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer rounded-xl transition-all duration-200 group"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex-shrink-0">
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
                  <span className="text-gray-900 font-medium group-hover:text-blue-700 transition-colors flex-1">
                    {String(suggestion.name)}
                  </span>
                  {suggestion.type === 'category' && (
                    <span className="text-xs text-gray-500 group-hover:text-blue-500">
                      Lihat semua →
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Quick search actions */}
            <div className="border-t border-gray-100 p-3 bg-gray-50/50">
              <button
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200"
              >
                <Search className="h-4 w-4" />
                Cari "{searchTerm}"
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default EnhancedSearch;
