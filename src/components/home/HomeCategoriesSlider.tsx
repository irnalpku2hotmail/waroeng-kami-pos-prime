
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Grid3X3 } from 'lucide-react';
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
  product_count?: number;
}

interface HomeCategoriesSliderProps {
  onCategorySelect?: (categoryId: string) => void;
}

const HomeCategoriesSlider = ({ onCategorySelect }: HomeCategoriesSliderProps) => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-with-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products(id)
        `)
        .order('name');

      if (error) throw error;

      return data.map(category => ({
        ...category,
        product_count: category.products?.length || 0
      }));
    }
  });

  const handleCategoryClick = (categoryId: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryId);
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
    <div className="relative">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {categories.map((category) => (
            <CarouselItem key={category.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6">
              <Card 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-500"
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="relative mb-3">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {category.icon_url ? (
                        <img 
                          src={category.icon_url} 
                          alt={category.name}
                          className="w-8 h-8 object-cover rounded-full"
                        />
                      ) : (
                        <Grid3X3 className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                    {category.product_count && category.product_count > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-blue-500">
                        {category.product_count}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                    {category.name}
                  </h3>
                  
                  {category.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
                    <Package className="h-3 w-3 mr-1" />
                    {category.product_count} produk
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default HomeCategoriesSlider;
