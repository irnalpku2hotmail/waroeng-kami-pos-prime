
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

interface BundleCarouselProps {
  title?: string;
  limit?: number;
  categoryId?: string;
}

const BundleCarousel = ({ title = '🔥 Paket Hemat Untuk Anda', limit = 10, categoryId }: BundleCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['bundles-active', limit, categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bundles')
        .select('id, name, slug, description, image_url, discount_price, original_price, savings_amount, savings_percentage, bundle_items(id, product_id)')
        .eq('status', 'active')
        .order('savings_percentage', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = isMobile ? 260 : 320;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  if (isLoading) {
    return (
      <div className="py-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => <Skeleton key={i} className="w-[240px] h-[280px] rounded-2xl flex-shrink-0" />)}
        </div>
      </div>
    );
  }

  if (bundles.length === 0) return null;

  return (
    <div className="py-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          {title}
        </h2>
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
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {bundles.map(bundle => (
          <div
            key={bundle.id}
            onClick={() => navigate(`/bundle/${bundle.slug}`)}
            className="flex-shrink-0 snap-start cursor-pointer group"
            style={{ width: isMobile ? '140px' : '170px' }}
          >
            <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5 active:scale-[0.97]">
              <div className="aspect-[4/3] bg-gradient-to-br from-orange-50 to-rose-50 relative overflow-hidden">
                {bundle.image_url ? (
                  <img src={bundle.image_url} alt={bundle.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-orange-300" />
                  </div>
                )}
                {bundle.savings_percentage && Number(bundle.savings_percentage) > 0 && (
                  <div className="absolute top-1 left-1">
                    <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      -{Number(bundle.savings_percentage).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-1">
                  {bundle.name}
                </h3>
                <span className="text-xs font-bold text-primary">{formatPrice(bundle.discount_price)}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground line-through">{formatPrice(bundle.original_price)}</span>
                  <span className="text-[10px] font-medium text-green-600">
                    -{formatPrice(Number(bundle.savings_amount || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BundleCarousel;
