
import React from 'react';
import { Input } from '@/components/ui/input';
import VoiceSearch from '@/components/VoiceSearch';
import { Search } from 'lucide-react';

interface ProductSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  handleVoiceSearch: (text: string) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ searchTerm, setSearchTerm, handleVoiceSearch }) => {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Cari produk atau scan barcode..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 pr-12"
      />
      <div className="absolute right-2 top-1.5">
        <VoiceSearch onVoiceResult={handleVoiceSearch} />
      </div>
    </div>
  );
};

export default ProductSearch;
