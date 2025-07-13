
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FlashSaleItem {
  id: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  stock_quantity: number;
  sold_quantity: number;
  products: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
  flash_sales: {
    name: string;
    end_date: string;
  } | null;
}

const FlashSaleCarousel = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const { data: flashSaleItems = [], isLoading } = useQuery({
    queryKey: ['flash-sale-items'],
    queryFn: async () => {
      console.log('Fetching flash sale items...');
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select(`
          id,
          original_price,
          sale_price,
          discount_percentage,
          stock_quantity,
          sold_quantity,
          products (
            id,
            name,
            image_url
          ),
          flash_sales (
            name,
            end_date
          )
        `)
        .eq('flash_sales.is_active', true)
        .gt('stock_quantity', 0)
        .order('discount_percentage', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching flash sale items:', error);
        throw error;
      }
      
      console.log('Flash sale items data:', data);
      return data as FlashSaleItem[];
    },
  });

  const totalPages = Math.ceil(flashSaleItems.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return flashSaleItems.slice(start, start + itemsPerPage);
  }, [flashSaleItems, currentPage]);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  if (isLoading || flashSaleItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900">Flash Sale</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevPage}
            disabled={totalPages <= 1}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextPage}
            disabled={totalPages <= 1}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentItems.map((item) => (
          <Card key={item.id} className="bg-white shadow-sm hover:shadow-md transition-shadow border border-red-200">
            <CardContent className="p-3">
              <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden relative">
                {item.products?.image_url ? (
                  <img 
                    src={item.products.image_url} 
                    alt={String(item.products?.name || 'Product')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                  -{item.discount_percentage || 0}%
                </Badge>
              </div>
              
              <h3 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                {String(item.products?.name || 'Unnamed Product')}
              </h3>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-600">
                    Rp {(item.sale_price || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 line-through">
                    Rp {(item.original_price || 0).toLocaleString('id-ID')}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Tersisa: {(item.stock_quantity || 0) - (item.sold_quantity || 0)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FlashSaleCarousel;
