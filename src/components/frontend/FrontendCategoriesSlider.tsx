
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

interface FrontendCategoriesSliderProps {
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

const FrontendCategoriesSlider = ({ 
  selectedCategory, 
  onCategorySelect 
}: FrontendCategoriesSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['frontend-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Update visible count based on screen size
  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth >= 1280) {
        setVisibleCount(8);
      } else if (window.innerWidth >= 1024) {
        setVisibleCount(6);
      } else if (window.innerWidth >= 768) {
        setVisibleCount(4);
      } else {
        setVisibleCount(3);
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  const nextSlide = () => {
    setCurrentIndex(prev => 
      prev + visibleCount >= categories.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex(prev => 
      prev === 0 ? Math.max(0, categories.length - visibleCount) : prev - 1
    );
  };

  if (isLoading || categories.length === 0) {
    return null;
  }

  const visibleCategories = categories.slice(currentIndex, currentIndex + visibleCount);
  const showNavigation = categories.length > visibleCount;

  return (
    <div className="px-4 py-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Kategori Produk</h2>
          {showNavigation && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevSlide}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextSlide}
                disabled={currentIndex + visibleCount >= categories.length}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {/* All Categories Button */}
            <button
              onClick={() => onCategorySelect(null)}
              className={`flex flex-col items-center p-4 rounded-lg border transition-all duration-200 ${
                selectedCategory === null
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Package className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium text-center">Semua</span>
            </button>

            {/* Category Buttons */}
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`flex flex-col items-center p-4 rounded-lg border transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {category.icon_url ? (
                  <img 
                    src={category.icon_url} 
                    alt={category.name}
                    className="h-8 w-8 mb-2 object-contain"
                  />
                ) : (
                  <Package className="h-8 w-8 mb-2" />
                )}
                <span className="text-sm font-medium text-center line-clamp-2">
                  {category.name}
                </span>
              </button>
            ))}
          </div>

          {/* Pagination Dots */}
          {showNavigation && (
            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({ length: Math.ceil(categories.length / visibleCount) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * visibleCount)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(currentIndex / visibleCount) === index
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FrontendCategoriesSlider;
