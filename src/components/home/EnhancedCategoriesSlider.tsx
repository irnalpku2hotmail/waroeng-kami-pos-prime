
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface EnhancedCategoriesSliderProps {
  onCategorySelect: (categoryId: string, categoryName: string) => void;
}

const EnhancedCategoriesSlider = ({ onCategorySelect }: EnhancedCategoriesSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
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
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || categories.length === 0) return;

    let scrollAmount = 0;
    const scrollStep = 1;
    const scrollDelay = 30;

    const autoScroll = () => {
      if (scrollContainer) {
        scrollAmount += scrollStep;
        scrollContainer.scrollLeft = scrollAmount;
        
        // Reset when reaching the end
        if (scrollAmount >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollAmount = 0;
        }
      }
    };

    const intervalId = setInterval(autoScroll, scrollDelay);

    // Pause on hover
    const handleMouseEnter = () => clearInterval(intervalId);
    const handleMouseLeave = () => {
      clearInterval(intervalId);
      const newIntervalId = setInterval(autoScroll, scrollDelay);
      return newIntervalId;
    };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(intervalId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [categories]);

  if (categories.length === 0) return null;

  return (
    <div className="mb-8">
      <div 
        ref={scrollRef}
        className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Duplicate categories for seamless loop */}
        {[...categories, ...categories].map((category, index) => (
          <Card
            key={`${category.id}-${index}`}
            className="min-w-[100px] h-24 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 group"
            onClick={() => onCategorySelect(category.id, category.name)}
          >
            <div className="h-full flex flex-col items-center justify-center p-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-2 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                {category.icon_url ? (
                  <img 
                    src={category.icon_url} 
                    alt={category.name}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <Package className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <p className="text-xs font-medium text-center text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-2">
                {category.name}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EnhancedCategoriesSlider;
