import React from 'react';
import { Input } from '@/components/ui/input';
import VoiceSearch from '@/components/VoiceSearch';
import { Search } from 'lucide-react';

interface ProductSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  handleVoiceSearch: (text: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  voiceSearchRef?: React.RefObject<HTMLButtonElement>;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  handleVoiceSearch,
  searchInputRef,
  voiceSearchRef,
}) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        ref={searchInputRef}
        placeholder="Cari produk atau scan barcode..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-10"
      />
      <div className="absolute right-1 top-1">
        <VoiceSearch onVoiceResult={handleVoiceSearch} buttonRef={voiceSearchRef} />
      </div>
    </div>
  );
};

export default ProductSearch;
