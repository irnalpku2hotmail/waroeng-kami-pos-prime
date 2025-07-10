
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Package, Grid3X3 } from 'lucide-react';
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
    <div className="px-4 py-8 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Grid3X3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kategori Produk</h2>
              <p className="text-gray-600">Jelajahi berbagai kategori pilihan</p>
            </div>
          </div>
          
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
            {/* All Categories */}
            <Card 
              className={`flex-shrink-0 cursor-pointer transition-all duration-300 hover:shadow-xl group ${
                selectedCategory === null 
                  ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                  : 'hover:shadow-lg hover:scale-105 bg-white'
              }`}
              onClick={() => onCategorySelect(null)}
            >
              <CardContent className="p-6 text-center min-w-[140px]">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  selectedCategory === null 
                    ? 'bg-blue-500 shadow-lg' 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-blue-200'
                }`}>
                  <Package className={`h-8 w-8 transition-colors duration-300 ${
                    selectedCategory === null ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                  }`} />
                </div>
                <p className={`text-sm font-semibold transition-colors duration-300 ${
                  selectedCategory === null ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                }`}>
                  Semua Kategori
                </p>
                <p className="text-xs text-gray-500 mt-1">Lihat Semua</p>
              </CardContent>
            </Card>

            {/* Category Cards */}
            {categories.map((category) => (
              <Card 
                key={category.id}
                className={`flex-shrink-0 cursor-pointer transition-all duration-300 hover:shadow-xl group ${
                  selectedCategory === category.id 
                    ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg' 
                    : 'hover:shadow-lg hover:scale-105 bg-white'
                }`}
                onClick={() => onCategorySelect(category.id)}
              >
                <CardContent className="p-6 text-center min-w-[140px]">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
                    selectedCategory === category.id 
                      ? 'bg-blue-500 shadow-lg' 
                      : 'bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200'
                  }`}>
                    {category.icon_url ? (
                      <img 
                        src={category.icon_url} 
                        alt={category.name}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    ) : (
                      <Package className={`h-8 w-8 transition-colors duration-300 ${
                        selectedCategory === category.id ? 'text-white' : 'text-blue-600'
                      }`} />
                    )}
                  </div>
                  <p className={`text-sm font-semibold line-clamp-2 transition-colors duration-300 ${
                    selectedCategory === category.id ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                  }`}>
                    {category.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pilih Kategori</p>
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
