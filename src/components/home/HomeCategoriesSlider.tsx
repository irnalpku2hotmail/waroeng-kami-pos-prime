
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';

interface HomeCategoriesSliderProps {
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

const HomeCategoriesSlider = ({ selectedCategory, onCategorySelect }: HomeCategoriesSliderProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 200;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (categories.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-center mb-6">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            className="h-12 w-12 p-0 rounded-full border-2 border-blue-200 bg-white/80 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-300 shadow-lg transition-all duration-300 hover:scale-105"
          >
            <ChevronLeft className="h-5 w-5 text-blue-600" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            className="h-12 w-12 p-0 rounded-full border-2 border-blue-200 bg-white/80 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-300 shadow-lg transition-all duration-300 hover:scale-105"
          >
            <ChevronRight className="h-5 w-5 text-blue-600" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div 
          ref={containerRef}
          className="flex gap-8 overflow-x-auto scrollbar-hide pb-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All Categories Button */}
          <button
            onClick={() => onCategorySelect(null)}
            className={`flex-shrink-0 flex flex-col items-center p-6 transition-all duration-300 min-w-[100px] transform hover:scale-110 ${
              selectedCategory === null
                ? 'opacity-100'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 shadow-lg transition-all duration-300 ${
              selectedCategory === null 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-blue-300' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-blue-100 hover:to-purple-100'
            }`}>
              <span className="text-2xl font-bold">
                All
              </span>
            </div>
          </button>

          {/* Category Buttons */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`flex-shrink-0 flex flex-col items-center p-6 transition-all duration-300 min-w-[100px] transform hover:scale-110 ${
                selectedCategory === category.id
                  ? 'opacity-100'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 overflow-hidden shadow-lg transition-all duration-300 ${
                selectedCategory === category.id 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-blue-300' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-blue-100 hover:to-purple-100'
              }`}>
                {category.icon_url ? (
                  <img
                    src={category.icon_url}
                    alt={category.name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <span className="font-bold text-xl">
                    {category.name.charAt(0)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeCategoriesSlider;
