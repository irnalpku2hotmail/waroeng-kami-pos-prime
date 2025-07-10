
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
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
    <div className="px-4 py-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Kategori</h2>
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
            {/* All Categories */}
            <Card 
              className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                selectedCategory === null 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md hover:scale-105'
              }`}
              onClick={() => onCategorySelect(null)}
            >
              <CardContent className="p-4 text-center min-w-[100px]">
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
                <p className="text-xs font-medium text-gray-900">Semua</p>
              </CardContent>
            </Card>

            {/* Category Cards */}
            {categories.map((category) => (
              <Card 
                key={category.id}
                className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  selectedCategory === category.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md hover:scale-105'
                }`}
                onClick={() => onCategorySelect(category.id)}
              >
                <CardContent className="p-4 text-center min-w-[100px]">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                    {category.icon_url ? (
                      <img 
                        src={category.icon_url} 
                        alt={category.name}
                        className="w-8 h-8 object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-900 line-clamp-2">
                    {category.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeCategoriesSlider;
