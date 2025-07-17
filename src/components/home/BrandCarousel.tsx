
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useRef } from 'react';

const BrandCarousel = () => {
  const { data: brands, isLoading } = useQuery({
    queryKey: ['product-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_brands')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!brands || brands.length === 0) return;

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const nextButton = carouselRef.current.querySelector('[data-carousel="next"]') as HTMLButtonElement;
        nextButton?.click();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [brands]);

  if (isLoading || !brands || brands.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Brand Terpercaya</h2>
      <div ref={carouselRef}>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {brands.map((brand) => (
              <CarouselItem key={brand.id} className="basis-1/6 md:basis-1/8 lg:basis-1/10">
                <Card className="border-0 shadow-none">
                  <CardContent className="p-2">
                    <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-lg">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-500 text-center">
                          {brand.name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext data-carousel="next" />
        </Carousel>
      </div>
    </div>
  );
};

export default BrandCarousel;
