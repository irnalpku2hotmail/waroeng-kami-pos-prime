import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ModernFrontendFlashSaleProps {
  onProductClick: (product: any) => void;
}

const ModernFrontendFlashSale = ({ onProductClick }: ModernFrontendFlashSaleProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: flashSales, isLoading } = useQuery({
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
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (!flashSales?.end_date) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(flashSales.end_date).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSales]);

  if (isLoading || !flashSales || !flashSales.flash_sale_items?.length) {
    return null;
  }

  const items = flashSales.flash_sale_items.filter(
    (item: any) => item.products && item.stock_quantity > 0
  );

  if (items.length === 0) return null;

  const itemsPerPage = 6;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const currentItems = items.slice(currentIndex, currentIndex + itemsPerPage);

  const handleNext = () => {
    if (currentIndex + itemsPerPage < items.length) {
      setCurrentIndex(currentIndex + itemsPerPage);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - itemsPerPage);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                FLASH SALE
              </h2>
              <p className="text-sm text-gray-600">{flashSales.description || 'Diskon Terbatas!'}</p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            <div className="flex gap-1 sm:gap-2">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-bold text-center min-w-[40px] sm:min-w-[50px]">
                <div className="text-lg sm:text-2xl">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-[10px] sm:text-xs">Jam</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-bold text-center min-w-[40px] sm:min-w-[50px]">
                <div className="text-lg sm:text-2xl">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-[10px] sm:text-xs">Menit</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-bold text-center min-w-[40px] sm:min-w-[50px]">
                <div className="text-lg sm:text-2xl">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-[10px] sm:text-xs">Detik</div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Carousel */}
        <div className="relative">
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-lg rounded-full h-10 w-10"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {currentItems.map((item: any) => {
              const product = item.products;
              const soldPercentage = (item.sold_quantity / item.stock_quantity) * 100;
              const remaining = item.stock_quantity - item.sold_quantity;

              return (
                <Card
                  key={item.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-orange-400"
                  onClick={() => onProductClick(product)}
                >
                  {/* Image with Badges */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    
                    {/* Flash Sale Badge */}
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs font-bold">
                      Flash Sale
                    </Badge>

                    {/* Discount Badge */}
                    <div className="absolute top-2 right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-md">
                      <div className="text-xs font-bold">-{Math.round(item.discount_percentage)}%</div>
                    </div>

                    {/* Stock Badge */}
                    {remaining < 10 && (
                      <Badge className="absolute bottom-2 left-2 bg-orange-600 text-white px-2 py-1 text-xs">
                        Stok Terbatas
                      </Badge>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3 space-y-2">
                    <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>

                    {/* Prices */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-orange-600">
                          {formatPrice(item.sale_price)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 line-through">
                        {formatPrice(item.original_price)}
                      </div>
                    </div>

                    {/* Stock Progress */}
                    <div className="space-y-1">
                      <Progress value={soldPercentage} className="h-2" />
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Terjual {item.sold_quantity}</span>
                        <span className="text-orange-600 font-semibold">Sisa {remaining}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {currentIndex + itemsPerPage < items.length && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-lg rounded-full h-10 w-10"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Page Indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  Math.floor(currentIndex / itemsPerPage) === idx
                    ? 'w-8 bg-orange-600'
                    : 'w-2 bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(idx * itemsPerPage)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernFrontendFlashSale;
