
import { Input } from '@/components/ui/input';

interface ProductsFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

const ProductsFilters = ({ searchTerm, setSearchTerm }: ProductsFiltersProps) => (
  <div className="flex gap-4">
    <Input
      placeholder="Cari produk atau barcode..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
      }}
      className="max-w-sm"
    />
  </div>
);

export default ProductsFilters;
