
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mic, MicOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EnhancedSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  className?: string;
}

const EnhancedSearch = ({ searchTerm, onSearchChange, onSearch, className = '' }: EnhancedSearchProps) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Fetch categories for search suggestions
  const { data: categories } = useQuery({
    queryKey: ['categories-search'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'id-ID';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange(transcript);
        handleSearch(transcript);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleSearch = (searchValue = searchTerm) => {
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleVoiceSearch = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleCategorySearch = (categoryName: string) => {
    onSearchChange(categoryName);
    handleSearch(categoryName);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Cari produk atau kategori..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-12 border-2 border-gray-200 focus:border-blue-500 rounded-full h-12"
        />
        <Button
          onClick={toggleVoiceSearch}
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-50"
        >
          {isListening ? (
            <MicOff className="h-4 w-4 text-red-500" />
          ) : (
            <Mic className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </div>

      {/* Category suggestions */}
      {categories && categories.length > 0 && !searchTerm && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-2">Cari berdasarkan kategori:</p>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 6).map((category) => (
              <Badge
                key={category.id}
                variant="secondary"
                className="cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => handleCategorySearch(category.name)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;
