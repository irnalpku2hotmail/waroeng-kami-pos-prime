
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import WishlistButton from '@/components/wishlist/WishlistButton';

interface ProductSimilarCarouselProps {
  categoryId: string;
  currentProductId: string;
}

const ProductSimilarCarousel = ({ categoryId, currentProductId }: ProductSimilarCarouselProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: similarProducts = [], isLoading } = useQuery({
    queryKey: ['similar-products', categoryId, currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation),
          product_brands (id, name, logo_url)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .limit(12);

      if (error) throw error;
      return data || [];
    },
    enabled: !!categoryId
  });

  const productIds = similarProducts.map((p: any) => p.id);
  const { data: ratingsMap = {} } = useQuery({
    queryKey: ['similar-ratings', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return {} as Record<string, { avg: number; count: number }>;
      const { data } = await supabase
        .from('product_reviews')
        .select('product_id, rating')
        .in('product_id', productIds);
      const map: Record<string, { avg: number; count: number }> = {};
      (data || []).forEach((r: any) => {
        if (!map[r.product_id]) map[r.product_id] = { avg: 0, count: 0 };
        map[r.product_id].count += 1;
        map[r.product_id].avg += r.rating;
      });
      Object.keys(map).forEach(id => { map[id].avg = map[id].avg / map[id].count; });
      return map;
    },
    enabled: productIds.length > 0,
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = isMobile ? 260 : 400;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (isLoading) return null;
  const validProducts = similarProducts.filter((p: any) => p && p.id && p.name);
  if (validProducts.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-bold text-foreground">Produk Serupa</h2>
        {!isMobile && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('left')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('right')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 md:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {validProducts.map((product: any) => {
          const rating = ratingsMap[product.id];
          const outOfStock = (product.current_stock || 0) <= 0;
          return (
            <Card
              key={product.id}
              className="flex-shrink-0 snap-start overflow-hidden cursor-pointer group border border-border/60 hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] rounded-xl"
              style={{ width: isMobile ? 130 : 170 }}
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No Image
                  </div>
                )}
                <div className="absolute top-1 right-1 z-10">
                  <WishlistButton productId={product.id} size="sm" />
                </div>
                {product.product_brands?.name && (
                  <div className="absolute top-1 left-1">
                    <span className="bg-background/90 backdrop-blur-sm text-[9px] font-semibold text-foreground px-1.5 py-0.5 rounded">
                      {product.product_brands.name}
                    </span>
                  </div>
                )}
                {outOfStock && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
                    <Badge variant="destructive" className="text-[10px]">Habis</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-2">
                <h3 className="font-semibold text-xs text-foreground line-clamp-2 leading-tight mb-1 min-h-[2em]">
                  {product.name}
                </h3>
                <p className="text-xs font-bold text-primary mb-1">
                  {formatPrice(product.selling_price || 0)}
                </p>
                <div className="flex items-center justify-between gap-1">
                  {rating && rating.count > 0 ? (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-[9px] font-medium text-foreground">
                        {rating.avg.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        ({rating.count})
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-muted-foreground">Belum ada ulasan</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProductSimilarCarousel;
