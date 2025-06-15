
import { Input } from '@/components/ui/input';

interface ProductsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ProductsFilters = ({ searchTerm, onSearchChange }: ProductsFiltersProps) => {
  return (
    <div className="flex gap-4">
      <Input
        placeholder="Cari produk atau barcode..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
    </div>
  );
};

export default ProductsFilters;
