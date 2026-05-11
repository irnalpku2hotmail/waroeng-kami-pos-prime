import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const CategoryGrid = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-grid'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
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
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <Skeleton className="w-14 h-14 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!categories.length) return null;

  // Split categories into 2 rows
  const half = Math.ceil(categories.length / 2);
  const row1 = categories.slice(0, half);
  const row2 = categories.slice(half);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm md:text-base text-foreground">Kategori</h2>
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
        className="overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex flex-col gap-3">
          {[row1, row2].map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-4 md:gap-5">
              {row.map((category) => (
                <button
                  key={category.id}
                  onClick={() => navigate(`/search?category=${category.id}`)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-card border-2 border-border/50 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg group-hover:border-primary/40">
                    {category.icon_url ? (
                      <img
                        src={category.icon_url}
                        alt={category.name}
                        className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full"
                      />
                    ) : (
                      <Package2 className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs text-foreground/70 font-medium text-center max-w-[60px] truncate group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid;
