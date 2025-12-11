import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package2, Grid3X3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
const CategoriesCarousel = () => {
  const navigate = useNavigate();
  const {
    data: categories = [],
    isLoading
  } = useQuery({
    queryKey: ['categories-carousel'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data || [];
    }
  });
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };
  if (isLoading) {
    return <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Grid3X3 className="h-6 w-6" />
          Kategori Produk
        </h2>
        <div className="flex space-x-4">
          {[...Array(6)].map((_, i) => <div key={i} className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse"></div>)}
        </div>
      </div>;
  }
  if (!categories.length) {
    return null;
  }
  return <div className="mb-8">
      <h2 className="font-bold mb-4 flex items-center gap-2 text-base text-destructive">
        
        Kategori Produk
      </h2>
      
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {categories.map(category => <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCategoryClick(category.id)}>
                <CardContent className="flex flex-col items-center justify-center p-4 h-24">
                  {category.icon_url ? <img src={category.icon_url} alt={category.name} className="w-8 h-8 mb-2 object-contain" /> : <Package2 className="h-8 w-8 text-blue-600 mb-2" />}
                  <span className="text-xs text-center font-medium line-clamp-1">
                    {category.name}
                  </span>
                </CardContent>
              </Card>
            </CarouselItem>)}
        </CarouselContent>
        <CarouselPrevious className="left-2 h-8 w-8" />
        <CarouselNext className="right-2 h-8 w-8" />
      </Carousel>
    </div>;
};
export default CategoriesCarousel;