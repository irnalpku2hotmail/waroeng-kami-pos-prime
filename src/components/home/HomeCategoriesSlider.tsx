
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
      const scrollAmount = 120;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;
      
      containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (categories.length === 0) return null;

  return (
    <div className="px-4 py-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Kategori Produk</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('left')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('right')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div 
            ref={containerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* All Categories Button */}
            <button
              onClick={() => onCategorySelect(null)}
              className={`flex-shrink-0 flex flex-col items-center p-4 rounded-2xl transition-all duration-200 min-w-[100px] ${
                selectedCategory === null
                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                selectedCategory === null ? 'bg-blue-600' : 'bg-gray-400'
              }`}>
                <span className="text-white font-bold text-lg">All</span>
              </div>
              <span className="text-sm font-medium text-center">Semua</span>
            </button>

            {/* Category Buttons */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`flex-shrink-0 flex flex-col items-center p-4 rounded-2xl transition-all duration-200 min-w-[100px] ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 overflow-hidden ${
                  selectedCategory === category.id ? 'bg-blue-600' : 'bg-white'
                }`}>
                  {category.icon_url ? (
                    <img
                      src={category.icon_url}
                      alt={category.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <span className={`font-bold text-lg ${
                      selectedCategory === category.id ? 'text-white' : 'text-gray-600'
                    }`}>
                      {category.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-center leading-tight">
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
