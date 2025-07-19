
import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  selling_price: number;
  image_url: string | null;
  current_stock: number;
  categories?: { name: string } | null;
}

const ProductCarousel = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-carousel'],
    queryFn: async () => {
      console.log('Fetching products for carousel...');
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          selling_price,
          image_url,
          current_stock,
          categories (name)
        `)
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      console.log('Products data:', data);
      return data as Product[];
    },
  });

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const currentProducts = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  const nextPage = useCallback(() => {
    if (totalPages > 1) {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }
  }, [totalPages]);

  const prevPage = useCallback(() => {
    if (totalPages > 1) {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    }
  }, [totalPages]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Produk Terbaru</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prevPage}
            disabled={totalPages <= 1}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextPage}
            disabled={totalPages <= 1}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentProducts.map((product) => (
          <Card key={product.id} className="bg-white shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <CardContent className="p-3">
              <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={String(product.name || 'Product')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
              </div>
              
              <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                {String(product.name || 'Unnamed Product')}
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600">
                  Rp {(product.selling_price || 0).toLocaleString('id-ID')}
                </span>
                <Badge variant="secondary" className="text-xs">
                  Stok: {product.current_stock || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
