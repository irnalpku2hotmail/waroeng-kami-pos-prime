
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
}

interface EnhancedCategoriesSliderProps {
  onCategorySelect?: (categoryId: string, categoryName: string) => void;
}

const EnhancedCategoriesSlider = ({ onCategorySelect }: EnhancedCategoriesSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-enhanced'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Auto scroll effect
  useEffect(() => {
    if (!scrollRef.current || categories.length === 0) return;

    const scrollContainer = scrollRef.current;
    let scrollPosition = 0;
    const scrollStep = 2;
    const scrollDelay = 50;

    const autoScroll = () => {
      if (scrollContainer) {
        scrollPosition += scrollStep;
        
        // Reset scroll position when reaching the end
        if (scrollPosition >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollPosition = 0;
        }
        
        scrollContainer.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    };

    const interval = setInterval(autoScroll, scrollDelay);

    // Pause auto-scroll on hover
    const handleMouseEnter = () => clearInterval(interval);
    const handleMouseLeave = () => {
      const newInterval = setInterval(autoScroll, scrollDelay);
      return newInterval;
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(interval);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [categories]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId, categoryName);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Kategori</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={scrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={scrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex-none group cursor-pointer"
            onClick={() => handleCategoryClick(category.id, String(category.name))}
          >
            <div className="relative">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                {category.icon_url ? (
                  <img 
                    src={category.icon_url} 
                    alt={String(category.name)}
                    className="w-8 h-8 object-cover rounded-full"
                  />
                ) : (
                  <Grid3X3 className="h-8 w-8 text-blue-600" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedCategoriesSlider;
