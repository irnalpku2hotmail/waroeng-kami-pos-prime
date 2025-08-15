
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Mic, MicOff } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MobileSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  showVoiceSearch?: boolean;
}

const MobileSearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  onSearch,
  placeholder = "Cari produk atau kategori...",
  showVoiceSearch = false
}: MobileSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (onSearch) {
      onSearch();
    }
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'id-ID';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onSearchChange(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="w-full relative">
      <Card className={`relative transition-all duration-200 ${
        isFocused ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'
      }`}>
        <div className="flex items-center">
          <div className="flex items-center flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors" />
            <Input
              ref={inputRef}
              type="search"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="pl-12 pr-20 py-4 text-base border-0 focus:ring-0 focus-visible:ring-0 bg-transparent placeholder:text-gray-500"
            />
            
            {/* Clear button */}
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="absolute right-16 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            )}

            {/* Voice search button */}
            {showVoiceSearch && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleVoiceSearch}
                disabled={isListening}
                className={`absolute right-8 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 animate-pulse" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Search button */}
          <Button
            onClick={handleSearch}
            className="m-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Cari
          </Button>
        </div>
      </Card>

      {/* Search suggestions or status */}
      {isListening && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-4 bg-red-50 border-red-200 z-50">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <Mic className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Mendengarkan...</span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MobileSearchBar;
