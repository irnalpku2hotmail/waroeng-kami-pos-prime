
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { useState, useRef } from 'react';

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

interface EnhancedCategoriesSliderProps {
  onCategorySelect: (categoryId: string, categoryName: string) => void;
}

const EnhancedCategoriesSlider = ({ onCategorySelect }: EnhancedCategoriesSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-slider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
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

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Kategori Produk</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-32 animate-pulse">
              <div className="bg-gray-200 aspect-square mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Kategori Produk</h2>
          <p className="text-gray-600">Jelajahi berbagai kategori produk pilihan</p>
        </div>
        
        <div className="flex gap-2">
          {showLeftButton && (
            <button
              onClick={scrollLeft}
              className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          
          {showRightButton && (
            <button
              onClick={scrollRight}
              className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => onCategorySelect(category.id, category.name)}
            className="flex-none w-32 cursor-pointer group"
          >
            <div className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center relative overflow-hidden">
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <Package className="h-12 w-12 text-blue-500 group-hover:text-blue-600 transition-colors" />
                )}
                
                {/* Gradient overlay for better text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="p-3 bg-white">
                <h3 className="font-semibold text-sm text-center text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs text-gray-500 text-center mt-1 line-clamp-1">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Hover effect indicator */}
            <div className="w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 mx-auto mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedCategoriesSlider;
