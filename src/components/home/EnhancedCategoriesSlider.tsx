
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Grid3X3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Kategori Produk</h2>
          <p className="text-gray-600">Jelajahi berbagai kategori produk kami</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={scrollLeft} className="rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={scrollRight} className="rounded-full">
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
            className="flex-none group cursor-pointer text-center"
            onClick={() => handleCategoryClick(category.id, category.name)}
          >
            <div className="relative mb-3">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden">
                {category.icon_url ? (
                  <img 
                    src={category.icon_url} 
                    alt={category.name}
                    className="w-12 h-12 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <Grid3X3 className="h-10 w-10 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200 max-w-20 mx-auto line-clamp-2">
              {category.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedCategoriesSlider;
