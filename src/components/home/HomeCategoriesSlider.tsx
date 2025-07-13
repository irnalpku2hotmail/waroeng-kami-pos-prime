
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
}

const HomeCategoriesSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon_url')
        .order('name');

      if (error) throw error;
      return data as Category[];
    },
  });

  const itemsPerView = 6;
  const maxIndex = Math.max(0, categories.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Kategori</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-20"></div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Kategori</h2>
        {categories.length > itemsPerView && (
          <div className="flex gap-2">
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="flex-shrink-0 w-1/3 md:w-1/6 px-2"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                  {category.icon_url ? (
                    <img 
                      src={category.icon_url} 
                      alt={category.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {category.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeCategoriesSlider;
