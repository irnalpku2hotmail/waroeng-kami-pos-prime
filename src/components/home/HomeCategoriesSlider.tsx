
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
      const scrollAmount = 150;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (categories.length === 0) return null;

  return (
    <div className="relative bg-white py-2">
      {/* Navigation buttons */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => scroll('left')}
          className="p-1 rounded-full bg-white shadow-md border hover:shadow-lg transition-shadow"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => scroll('right')}
          className="p-1 rounded-full bg-white shadow-md border hover:shadow-lg transition-shadow"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* All Categories Button */}
        <button
          onClick={() => onCategorySelect(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all duration-200 ${
            selectedCategory === null
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
          }`}
        >
          <span className="text-sm font-medium whitespace-nowrap">
            Semua
          </span>
        </button>

        {/* Category Buttons */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
            }`}
          >
            <span className="text-sm font-medium whitespace-nowrap">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeCategoriesSlider;
