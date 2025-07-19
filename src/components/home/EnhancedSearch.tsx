
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Mic, MicOff } from 'lucide-react';
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
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isListening, setIsListening] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
          .eq('is_active', true)
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
      const categorySuggestions: SearchSuggestion[] = searchData.categories.map(c => ({
        type: 'category',
        id: c.id,
        name: c.name
      }));

      const productSuggestions: SearchSuggestion[] = searchData.products.map(p => ({
        type: 'product',
        id: p.id,
        name: p.name
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

  useEffect(() => {
    // Setup speech recognition
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
        // Auto search after voice input
        setTimeout(() => {
          handleSearch(transcript);
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

  const handleSearch = (term?: string) => {
    const searchQuery = term || searchTerm;
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    onSearchChange(suggestion.name);
    navigate(`/search?q=${encodeURIComponent(suggestion.name)}`);
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
    <div className="flex-1 max-w-2xl mx-8 hidden md:block" ref={searchRef}>
      <form onSubmit={handleFormSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Cari produk atau kategori..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="pl-10 pr-16 py-2 w-full bg-white/90 backdrop-blur-sm border-white/20 focus:bg-white focus:border-blue-300 rounded-full"
          />
          <Button
            type="button"
            onClick={handleVoiceSearch}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
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
                <Badge variant={suggestion.type === 'category' ? 'secondary' : 'outline'} className="text-xs">
                  {suggestion.type === 'category' ? 'Kategori' : 'Produk'}
                </Badge>
                <span className="text-gray-900">{suggestion.name}</span>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default EnhancedSearch;
