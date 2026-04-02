import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flame, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface ModernFrontendFlashSaleProps {
  onProductClick: (product: any) => void;
  onAuthRequired?: () => void;
}

const ModernFrontendFlashSale = ({ onProductClick, onAuthRequired }: ModernFrontendFlashSaleProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isMobile = useIsMobile();

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Require login before adding to cart
    if (!user) {
      onAuthRequired?.();
      toast({
        title: 'Login Diperlukan',
        description: 'Silakan login terlebih dahulu untuk berbelanja',
      });
      return;
    }

    const product = item.products;
    const remaining = item.stock_quantity - item.sold_quantity;
    
    if (remaining <= 0) {
      toast({
        title: 'Stok habis',
        description: 'Produk flash sale ini sudah habis',
        variant: 'destructive',
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: item.sale_price,
      quantity: 1,
      image: product.image_url,
      stock: remaining,
      flashSalePrice: item.sale_price,
      isFlashSale: true,
      product_id: product.id,
      unit_price: item.sale_price,
      total_price: item.sale_price,
    });

    toast({
      title: 'Ditambahkan ke keranjang',
      description: `${product.name} berhasil ditambahkan`,
    });
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Calculate visible items based on screen size (show 3 on mobile, more on larger screens)
  const getVisibleItems = () => {
    const visibleCount = 4; // Default visible items in carousel
    const start = currentIndex;
    const end = Math.min(start + visibleCount, items.length);
    return items.slice(start, end);
  };

  const visibleItems = getVisibleItems();

  return (
    <div className={isMobile ? 'px-3 py-2' : 'bg-gradient-to-r from-orange-50 to-red-50 py-6'}>
      <div className={isMobile ? '' : 'container mx-auto px-4'}>
        {isMobile ? (
          <>
            {/* Mobile: Header row - icon + title + countdown */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 tracking-tight">
                  FLASH SALE
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { val: timeLeft.hours, label: 'Jam' },
                  { val: timeLeft.minutes, label: 'Menit' },
                  { val: timeLeft.seconds, label: 'Detik' },
                ].map((t, i) => (
                  <div key={i} className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-center min-w-[28px]">
                    <div className="text-xs font-bold leading-tight">{String(t.val).padStart(2, '0')}</div>
                    <div className="text-[7px] leading-tight">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: Compact product grid */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {items.map((item: any) => {
                const product = item.products;
                const remaining = item.stock_quantity - item.sold_quantity;

                return (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-[140px] bg-card rounded-lg overflow-hidden border shadow-sm"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={product.image_url || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 right-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-1 py-0.5 rounded text-[9px] font-bold">
                        -{Math.round(item.discount_percentage)}%
                      </div>
                      {remaining < 10 && (
                        <Badge className="absolute top-1 left-1 bg-orange-600 text-white px-1 py-0 text-[7px] h-auto">
                          Sisa {remaining}
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        className="absolute bottom-1 right-1 h-6 w-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow"
                        onClick={(e) => handleAddToCart(item, e)}
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Info */}
                    <div className="p-1.5">
                      <h3 className="font-medium text-[11px] line-clamp-1 text-foreground">{product.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs font-bold text-orange-600">{formatPrice(item.sale_price)}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground line-through">{formatPrice(item.original_price)}</span>
                      <div className="text-[9px] text-muted-foreground mt-0.5">Terjual {item.sold_quantity}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Desktop: Keep existing layout */
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-row items-center justify-between gap-3 mb-4">
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
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-orange-600" />
                <div className="flex gap-1">
                  {[
                    { val: timeLeft.hours, label: 'Jam' },
                    { val: timeLeft.minutes, label: 'Menit' },
                    { val: timeLeft.seconds, label: 'Detik' },
                  ].map((t, i) => (
                    <div key={i} className="bg-gradient-to-br from-orange-500 to-red-500 text-white px-2 py-1 rounded text-center min-w-[40px]">
                      <div className="text-lg font-bold">{String(t.val).padStart(2, '0')}</div>
                      <div className="text-[10px]">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              {currentIndex > 0 && (
                <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 bg-white shadow-lg rounded-full h-10 w-10" onClick={handlePrev}>
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              <div className="flex gap-3 overflow-hidden">
                {visibleItems.map((item: any) => {
                  const product = item.products;
                  const soldPercentage = (item.sold_quantity / item.stock_quantity) * 100;
                  const remaining = item.stock_quantity - item.sold_quantity;
                  return (
                    <Card key={item.id} className="flex-shrink-0 w-[calc(25%-9px)] hover:shadow-lg transition-all duration-300 overflow-hidden border border-transparent hover:border-orange-400">
                      <div className="relative aspect-square overflow-hidden">
                        <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        <div className="absolute top-1 right-1 bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-bold">-{Math.round(item.discount_percentage)}%</div>
                        <Button size="icon" className="absolute bottom-1 right-1 h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg" onClick={(e) => handleAddToCart(item, e)}>
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        {remaining < 10 && (
                          <Badge className="absolute top-1 left-1 bg-orange-600 text-white px-1 py-0.5 text-[10px]">Sisa {remaining}</Badge>
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-base font-bold text-orange-600">{formatPrice(item.sale_price)}</span>
                          <span className="text-xs text-gray-500 line-through">{formatPrice(item.original_price)}</span>
                        </div>
                        <div className="space-y-0.5">
                          <Progress value={soldPercentage} className="h-1.5" />
                          <div className="text-xs text-gray-500">Terjual {item.sold_quantity}</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              {currentIndex + 4 < items.length && (
                <Button variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 bg-white shadow-lg rounded-full h-10 w-10" onClick={handleNext}>
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>
            {items.length > 4 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {Array.from({ length: Math.ceil(items.length / 4) }).map((_, idx) => (
                  <button key={idx} className={`h-1.5 rounded-full transition-all ${Math.floor(currentIndex / 4) === idx ? 'w-6 bg-orange-600' : 'w-1.5 bg-gray-300'}`} onClick={() => setCurrentIndex(idx * 4)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernFrontendFlashSale;
