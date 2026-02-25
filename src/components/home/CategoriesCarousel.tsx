import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';

const CATEGORY_COLORS = [
  { bg: 'from-rose-400 to-pink-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'from-amber-400 to-orange-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { bg: 'from-emerald-400 to-green-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'from-sky-400 to-blue-500', light: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  { bg: 'from-violet-400 to-purple-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  { bg: 'from-fuchsia-400 to-pink-500', light: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  { bg: 'from-teal-400 to-cyan-500', light: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  { bg: 'from-red-400 to-rose-500', light: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  { bg: 'from-indigo-400 to-blue-500', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'from-lime-400 to-green-500', light: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
];

const CategoriesCarousel = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-carousel'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8 rounded-2xl p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="flex gap-3 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-24 h-[220px] rounded-xl bg-white/60 animate-pulse flex-none" />
          ))}
        </div>
      </div>
    );
  }

  if (!categories.length) return null;

  // Split categories into pairs for 2-row layout
  const categoryPairs: Array<[typeof categories[0], typeof categories[0] | undefined]> = [];
  for (let i = 0; i < categories.length; i += 2) {
    categoryPairs.push([categories[i], categories[i + 1]]);
  }

  return (
    <div className="mb-8 relative">
      {/* Batik-styled container */}
      <div
        className="rounded-2xl p-4 md:p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 25%, #FECDD3 50%, #E0E7FF 75%, #CCFBF1 100%)',
        }}
      >
        {/* Batik decorative pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Secondary batik motif */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000'%3E%3Cpath d='M40 0C17.9 0 0 17.9 0 40s17.9 40 40 40 40-17.9 40-40S62.1 0 40 0zm0 72C22.3 72 8 57.7 8 40S22.3 8 40 8s32 14.3 32 32-14.3 32-32 32zm0-56C26.7 16 16 26.7 16 40s10.7 24 24 24 24-10.7 24-24-10.7-24-24-24zm0 40c-8.8 0-16-7.2-16-16s7.2-16 16-16 16 7.2 16 16-7.2 16-16 16z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shadow-md">
              <Package2 className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base md:text-lg font-bold text-foreground">
              Kategori Produk
            </h2>
          </div>
          <div className="hidden md:flex gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border-white/50 hover:bg-white shadow-sm"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm border-white/50 hover:bg-white shadow-sm"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 2-Row Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto relative z-10 pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {categoryPairs.map((pair, pairIndex) => (
            <div key={pairIndex} className="flex-none flex flex-col gap-2.5 snap-start">
              {pair.map((category, rowIndex) => {
                if (!category) return null;
                const colorIndex = (pairIndex * 2 + rowIndex) % CATEGORY_COLORS.length;
                const color = CATEGORY_COLORS[colorIndex];

                return (
                  <div
                    key={category.id}
                    className="w-[100px] md:w-[120px] cursor-pointer group"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className={`rounded-xl ${color.light} ${color.border} border p-2.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg`}>
                      {/* Icon circle */}
                      <div className={`w-12 h-12 md:w-14 md:h-14 mx-auto rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center shadow-md mb-2 transition-transform duration-300 group-hover:rotate-3`}>
                        {category.icon_url ? (
                          <img
                            src={getOptimizedImageUrl(category.icon_url, 64, 64)}
                            alt={category.name}
                            className="w-7 h-7 md:w-8 md:h-8 object-contain drop-shadow-sm"
                            width={32}
                            height={32}
                            loading="lazy"
                          />
                        ) : (
                          <Package2 className="h-6 w-6 md:h-7 md:w-7 text-white drop-shadow-sm" />
                        )}
                      </div>
                      {/* Name */}
                      <p className={`text-[11px] md:text-xs text-center font-semibold ${color.text} line-clamp-2 leading-tight`}>
                        {category.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesCarousel;
