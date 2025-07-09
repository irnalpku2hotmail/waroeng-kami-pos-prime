
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductsFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  stockFilter: string;
  categories: Array<{
    id: string;
    name: string;
  }>;
  onFiltersChange: (filters: {
    searchTerm?: string;
    selectedCategory?: string;
    stockFilter?: string;
  }) => void;
}

const ProductsFilters = ({ 
  searchTerm, 
  selectedCategory, 
  stockFilter, 
  categories, 
  onFiltersChange 
}: ProductsFiltersProps) => (
  <div className="flex gap-4 flex-wrap">
    <Input
      placeholder="Cari produk atau barcode..."
      value={searchTerm}
      onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
      className="max-w-sm"
    />
    
    <Select value={selectedCategory} onValueChange={(value) => onFiltersChange({ selectedCategory: value })}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Pilih kategori" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Semua Kategori</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select value={stockFilter} onValueChange={(value) => onFiltersChange({ stockFilter: value })}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Filter stok" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua Stok</SelectItem>
        <SelectItem value="in_stock">Tersedia</SelectItem>
        <SelectItem value="low_stock">Stok Rendah</SelectItem>
        <SelectItem value="out_of_stock">Habis</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export default ProductsFilters;
