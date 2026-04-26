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
    <div className="py-0">
      {/* Header: icon + title + description + countdown */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground">
              FLASH SALE
            </h2>
            {!isMobile && flashSales.description && (
              <p className="text-xs text-muted-foreground">{flashSales.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[
            { val: timeLeft.hours, label: 'Jam' },
            { val: timeLeft.minutes, label: 'Menit' },
            { val: timeLeft.seconds, label: 'Detik' },
          ].map((t, i) => (
            <div key={i} className="bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded text-center min-w-[28px]">
              <div className="text-xs font-bold leading-tight">{String(t.val).padStart(2, '0')}</div>
              <div className="text-[7px] leading-tight">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Product cards - horizontal scroll */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item: any) => {
          const product = item.products;
          const remaining = item.stock_quantity - item.sold_quantity;

          return (
            <div
              key={item.id}
              className="flex-shrink-0 snap-start group"
              style={{ width: isMobile ? '140px' : '170px' }}
            >
              <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/60 group-hover:border-orange-500 transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 active:scale-[0.98]">
                {/* Image */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Discount badge */}
                  <div className="absolute top-1 left-1">
                    <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      -{Math.round(item.discount_percentage)}%
                    </span>
                  </div>
                  {remaining < 10 && (
                    <Badge className="absolute top-1 right-1 bg-orange-600 text-white px-1 py-0 text-[7px] h-auto">
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
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-1">{product.name}</h3>
                  <span className="text-xs font-bold text-primary">{formatPrice(item.sale_price)}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground line-through">{formatPrice(item.original_price)}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Terjual {item.sold_quantity}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModernFrontendFlashSale;
