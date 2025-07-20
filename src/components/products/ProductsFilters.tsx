
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ProductsFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
}

const ProductsFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  categoryFilter, 
  setCategoryFilter 
}: ProductsFiltersProps) => {
  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
  };

  const hasActiveFilters = searchTerm || categoryFilter;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <Input
        placeholder="Cari produk atau barcode..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="max-w-sm">
          <SelectValue placeholder="Filter Kategori" />
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

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Hapus Filter
        </Button>
      )}
    </div>
  );
};

export default ProductsFilters;
