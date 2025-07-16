
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';

interface FlashSaleCarouselProps {
  onProductClick: (product: any) => void;
}

const FlashSaleCarousel = ({ onProductClick }: FlashSaleCarouselProps) => {
  const { addItem } = useCart();

  const { data: flashSaleItems, isLoading } = useQuery({
    queryKey: ['active-flash-sale-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select(`
          *,
          products (
            id,
            name,
            image_url,
            current_stock,
            categories (
              name
            )
          ),
          flash_sales (
            id,
            name,
            end_date,
            is_active
          )
        `)
        .eq('flash_sales.is_active', true)
        .gt('stock_quantity', 0)
        .limit(8);

      if (error) throw error;
      return data;
    }
  });

  const handleAddToCart = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (!item.products) return;
    
    addItem({
      id: item.products.id,
      name: item.products.name,
      price: item.sale_price,
      image: item.products.image_url,
      quantity: 1
    });
    toast({
      title: "Produk Flash Sale ditambahkan",
      description: `${item.products.name} telah ditambahkan ke keranjang`,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!flashSaleItems?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Tidak ada flash sale aktif saat ini</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {flashSaleItems?.map((item) => (
        <Card 
          key={item.id} 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200 group relative overflow-hidden"
          onClick={() => onProductClick(item.products)}
        >
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-red-500 text-white">
              <Zap className="h-3 w-3 mr-1" />
              -{item.discount_percentage}%
            </Badge>
          </div>
          
          <CardContent className="p-3">
            <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
              <img
                src={item.products?.image_url || '/placeholder.svg'}
                alt={item.products?.name || 'Product'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                {item.products?.name}
              </h3>
              
              {item.products?.categories && (
                <Badge variant="secondary" className="text-xs">
                  {item.products.categories.name}
                </Badge>
              )}
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-red-600 text-sm">
                      Rp {item.sale_price?.toLocaleString('id-ID') || '0'}
                    </span>
                    <span className="text-xs text-gray-500 line-through">
                      Rp {item.original_price?.toLocaleString('id-ID') || '0'}
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={(e) => handleAddToCart(e, item)}
                    className="h-8 w-8 p-0"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500">
                  Sisa: {item.stock_quantity} / Terjual: {item.sold_quantity}
                </div>
                
                {item.flash_sales?.end_date && (
                  <CountdownTimer endTime={item.flash_sales.end_date} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FlashSaleCarousel;
