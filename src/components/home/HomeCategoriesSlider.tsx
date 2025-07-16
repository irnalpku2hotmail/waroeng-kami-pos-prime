
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Grid3X3 } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
}

interface HomeCategoriesSliderProps {
  onCategorySelect?: (categoryId: string) => void;
}

const HomeCategoriesSlider = ({ onCategorySelect }: HomeCategoriesSliderProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-slider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Auto scroll effect
  useEffect(() => {
    if (!carouselRef.current) return;

    const interval = setInterval(() => {
      const nextButton = carouselRef.current?.querySelector('[data-testid="carousel-next"]') as HTMLButtonElement;
      if (nextButton) {
        nextButton.click();
      }
    }, 3000); // Auto scroll every 3 seconds

    return () => clearInterval(interval);
  }, [categories]);

  const handleCategoryClick = (categoryId: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative" ref={carouselRef}>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {categories.map((category) => (
            <CarouselItem key={category.id} className="basis-1/4 md:basis-1/6 lg:basis-1/8">
              <div 
                className="group cursor-pointer p-2"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="relative">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                    {category.icon_url ? (
                      <img 
                        src={category.icon_url} 
                        alt={category.name}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    ) : (
                      <Grid3X3 className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" data-testid="carousel-next" />
      </Carousel>
    </div>
  );
};

export default HomeCategoriesSlider;
