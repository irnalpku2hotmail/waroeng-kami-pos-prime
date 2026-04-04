import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

const CategoryGrid = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-grid'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className={`grid ${isMobile ? 'grid-cols-5 gap-2' : 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3'}`}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    );
  }

  if (!categories.length) return null;

  return (
    <div>
      <h2 className="font-bold text-sm md:text-base text-foreground mb-3">Kategori</h2>
      <div className={`grid ${isMobile ? 'grid-cols-5 gap-y-3 gap-x-2' : 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3'}`}>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => navigate(`/search?category=${category.id}`)}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent/60 border border-border/40 flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-md group-hover:bg-primary/10 group-hover:border-primary/30">
              {category.icon_url ? (
                <img
                  src={category.icon_url}
                  alt={category.name}
                  className="w-6 h-6 md:w-7 md:h-7 object-contain"
                />
              ) : (
                <Package2 className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
            <span className="text-[10px] md:text-xs text-center text-foreground/80 font-medium line-clamp-2 leading-tight">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;
