
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProductsFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  selectedUnit: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onUnitChange: (value: string) => void;
}

const ProductsFilters = ({ 
  searchTerm, 
  selectedCategory,
  selectedUnit,
  onSearchChange,
  onCategoryChange,
  onUnitChange
}: ProductsFiltersProps) => {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="flex gap-4">
      <Input
        placeholder="Cari produk atau barcode..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Pilih kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Semua Kategori</SelectItem>
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedUnit} onValueChange={onUnitChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Pilih satuan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Semua Satuan</SelectItem>
          {units?.map((unit) => (
            <SelectItem key={unit.id} value={unit.id}>
              {unit.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductsFilters;
