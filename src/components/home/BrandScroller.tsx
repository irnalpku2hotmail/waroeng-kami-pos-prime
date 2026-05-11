import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

const BrandScroller = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands-scroller'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_brands')
        .select('id, name, logo_url')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!brands.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm md:text-base text-foreground">Brand Pilihan</h2>
        {!isMobile && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => scroll('left')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => scroll('right')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-5 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => navigate(`/search?brand=${brand.id}`)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start group"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-card border-2 border-border/50 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg group-hover:border-primary/40">
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full"
                />
              ) : (
                <Store className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
            <span className="text-[10px] md:text-xs text-foreground/70 font-medium text-center max-w-[60px] truncate group-hover:text-primary transition-colors">
              {brand.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BrandScroller;
