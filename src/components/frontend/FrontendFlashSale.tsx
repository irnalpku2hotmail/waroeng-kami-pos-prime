
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FrontendFlashSaleProps {
  onProductClick: (product: any) => void;
}

const FrontendFlashSale = ({ onProductClick }: FrontendFlashSaleProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

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
            products(*)
          )
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (flashSales.length > 0) {
      const timer = setInterval(() => {
        const now = new Date();
        const endDate = new Date(flashSales[0].end_date);
        const difference = endDate.getTime() - now.getTime();

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeLeft({ hours, minutes, seconds });
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [flashSales]);

  if (flashSales.length === 0) return null;

  const currentSale = flashSales[0];
  const saleItems = currentSale.flash_sale_items || [];

  return (
    <div className="px-4 py-6 bg-gradient-to-r from-red-50 to-orange-50">
      <div className="max-w-7xl mx-auto">
        {/* Flash Sale Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-8 w-8 text-red-500 animate-pulse" />
            <h2 className="text-3xl font-bold text-red-600">FLASH SALE</h2>
            <Zap className="h-8 w-8 text-red-500 animate-pulse" />
          </div>
          <p className="text-gray-600 mb-4">{currentSale.name}</p>
          
          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Clock className="h-5 w-5 text-red-500" />
            <div className="flex items-center gap-2">
              <div className="bg-red-500 text-white px-3 py-1 rounded font-bold">
                {timeLeft.hours.toString().padStart(2, '0')}
              </div>
              <span className="text-red-500 font-bold">:</span>
              <div className="bg-red-500 text-white px-3 py-1 rounded font-bold">
                {timeLeft.minutes.toString().padStart(2, '0')}
              </div>
              <span className="text-red-500 font-bold">:</span>
              <div className="bg-red-500 text-white px-3 py-1 rounded font-bold">
                {timeLeft.seconds.toString().padStart(2, '0')}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Jam : Menit : Detik</p>
        </div>

        {/* Flash Sale Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {saleItems.slice(0, 8).map((item) => {
            const product = item.products;
            const discountPercent = Math.round(item.discount_percentage);
            const originalPrice = item.original_price;
            const salePrice = item.sale_price;
            const soldPercent = Math.min((item.sold_quantity / item.stock_quantity) * 100, 100);

            return (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-red-200 hover:border-red-400"
                onClick={() => onProductClick(product)}
              >
                <div className="relative">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{discountPercent}%
                  </Badge>
                  {item.stock_quantity - item.sold_quantity <= 5 && (
                    <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
                      Stok Terbatas!
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 text-sm line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-red-600">
                        Rp {salePrice.toLocaleString('id-ID')}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        Rp {originalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Terjual {item.sold_quantity}</span>
                        <span>Tersisa {item.stock_quantity - item.sold_quantity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${soldPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-red-500 hover:bg-red-600 text-white"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductClick(product);
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Beli Sekarang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FrontendFlashSale;
