
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
    <div className="px-4 py-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('left')}
              className="h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('right')}
              className="h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div 
            ref={containerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* All Categories Button */}
            <button
              onClick={() => onCategorySelect(null)}
              className={`flex-shrink-0 flex flex-col items-center p-6 rounded-3xl transition-all duration-300 min-w-[120px] transform hover:scale-105 ${
                selectedCategory === null
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-2 border-blue-500 backdrop-blur-sm'
                  : 'bg-white/10 backdrop-blur-sm border border-gray-200/50 hover:bg-white/20'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                selectedCategory === null 
                  ? 'bg-blue-500/20 backdrop-blur-sm' 
                  : 'bg-gray-100/50 backdrop-blur-sm'
              }`}>
                <span className={`text-2xl font-bold ${
                  selectedCategory === null ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  All
                </span>
              </div>
              <span className="text-sm font-semibold text-center leading-tight text-gray-700">
                All Products
              </span>
            </button>

            {/* Category Buttons */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`flex-shrink-0 flex flex-col items-center p-6 rounded-3xl transition-all duration-300 min-w-[120px] transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-2 border-blue-500 backdrop-blur-sm'
                    : 'bg-white/10 backdrop-blur-sm border border-gray-200/50 hover:bg-white/20'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 overflow-hidden ${
                  selectedCategory === category.id 
                    ? 'bg-blue-500/20 backdrop-blur-sm' 
                    : 'bg-gray-100/50 backdrop-blur-sm'
                }`}>
                  {category.icon_url ? (
                    <img
                      src={category.icon_url}
                      alt={category.name}
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <span className={`font-bold text-xl ${
                      selectedCategory === category.id ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {category.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-center leading-tight text-gray-700">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeCategoriesSlider;
