import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Zap, Clock, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import CountdownTimer from '@/components/CountdownTimer';

interface HomeFlashSaleProps {
  onProductClick: (product: any) => void;
}

const HomeFlashSale = ({ onProductClick }: HomeFlashSaleProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useState<HTMLDivElement | null>(null)[0];

  // Fetch active flash sales
  const { data: flashSales = [] } = useQuery({
    queryKey: ['active-flash-sales'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items(
            *,
            products(
              *,
              categories(name),
              units(name, abbreviation)
            )
          )
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef) {
      const scrollAmount = 280;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      containerRef.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  // Get all flash sale items
  const flashSaleItems = flashSales.flatMap(sale => 
    sale.flash_sale_items?.map(item => ({
      ...item,
      flashSale: sale,
      product: item.products
    })) || []
  );

  if (flashSaleItems.length === 0) return null;

  return (
    <div className="px-4 py-6 bg-gradient-to-r from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-red-500 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-900">Flash Sale</h2>
            </div>
            {flashSales[0] && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Berakhir dalam:</span>
                <CountdownTimer 
                  endDate={flashSales[0].end_date}
                  onExpire={() => {}}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('left')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('right')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div 
            ref={(ref) => containerRef && ref && (containerRef as any).current = ref}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {flashSaleItems.map((item) => {
              const discountPercent = Math.round(((item.original_price - item.sale_price) / item.original_price) * 100);
              const soldPercent = Math.round((item.sold_quantity / item.stock_quantity) * 100);
              
              return (
                <Card 
                  key={item.id}
                  className="flex-shrink-0 w-56 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group border-2 border-red-200"
                  onClick={() => onProductClick({...item.product, flash_sale_price: item.sale_price})}
                >
                  <div className="relative">
                    <img
                      src={item.product?.image_url || '/placeholder.svg'}
                      alt={item.product?.name}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                      -{discountPercent}%
                    </Badge>
                    <Badge className="absolute top-2 right-2 bg-orange-500">
                      <Zap className="h-3 w-3 mr-1" />
                      Flash Sale
                    </Badge>
                  </div>
                  
                  <CardContent className="p-3">
                    <h3 className="font-semibold mb-2 text-sm line-clamp-2 h-10">
                      {item.product?.name}
                    </h3>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600">
                          Rp {item.sale_price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 line-through">
                          Rp {item.original_price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Terjual {item.sold_quantity}</span>
                        <span className="text-gray-600">{soldPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(soldPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>Sisa {item.stock_quantity - item.sold_quantity}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeFlashSale;
