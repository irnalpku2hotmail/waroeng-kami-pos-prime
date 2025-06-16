
import React from 'react';
import { Input } from '@/components/ui/input';
import VoiceSearch from '@/components/VoiceSearch';
import { Search } from 'lucide-react';

interface ProductSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  handleVoiceSearch: (text: string) => void;
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ 
  searchTerm, 
  setSearchTerm, 
  handleVoiceSearch,
  isVoiceActive,
  setIsVoiceActive
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari produk atau scan barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <VoiceSearch 
        onVoiceResult={handleVoiceSearch} 
        isActive={isVoiceActive}
        onActiveChange={setIsVoiceActive}
      />
    </div>
  );
};

export default ProductSearch;
