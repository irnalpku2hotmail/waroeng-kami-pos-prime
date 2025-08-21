
import React from 'react';
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
import Autoplay from 'embla-carousel-autoplay';

const CompactBannerCarousel = () => {
  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'frontend_banners')
        .single();

      if (error) {
        console.error('Error fetching banners:', error);
        return [];
      }

      return data?.value?.banners || [];
    }
  });

  if (!banners.length) {
    return (
      <div className="w-full h-32 md:h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold">Selamat Datang!</h2>
          <p className="text-sm md:text-base opacity-90">Temukan produk terbaik untuk Anda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-6">
      <Carousel
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner: any, index: number) => (
            <CarouselItem key={index}>
              <Card>
                <CardContent className="p-0">
                  <div className="relative w-full h-32 md:h-48 overflow-hidden rounded-xl">
                    <img
                      src={banner.image_url || '/placeholder.svg'}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-start">
                      <div className="text-white p-4 md:p-6">
                        {banner.title && (
                          <h2 className="text-lg md:text-2xl font-bold mb-1 md:mb-2">
                            {banner.title}
                          </h2>
                        )}
                        {banner.subtitle && (
                          <p className="text-sm md:text-base opacity-90">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
};

export default CompactBannerCarousel;
