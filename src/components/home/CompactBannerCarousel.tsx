
import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const CompactBannerCarousel = () => {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );
  const { data: banners = [] } = useQuery({
    queryKey: ['banner-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'banner_images')
        .single();

      if (error) {
        console.log('No banner images found');
        return [];
      }

      // Handle the banner_images array directly
      return Array.isArray(data?.value) ? data.value : [];
    }
  });

  if (!banners.length) {
    return (
      <div className="w-full h-32 md:h-40 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4">
        <div className="text-center">
          <h2 className="text-lg md:text-xl font-bold">Selamat Datang di TokoQu!</h2>
          <p className="text-xs md:text-sm opacity-90">Temukan produk terbaik untuk Anda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-4">
      <Carousel
        plugins={[autoplayPlugin.current] as any}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((imageUrl: string, index: number) => (
            <CarouselItem key={index}>
              <Card>
                <CardContent className="p-0">
                  <div className="relative w-full h-32 md:h-40 overflow-hidden rounded-xl">
                    <img
                      src={imageUrl || '/placeholder.svg'}
                      alt={`Banner ${index + 1}`}
                      className="w-full h-full object-cover"
                      style={{ aspectRatio: '16/9' }}
                      width="1301"
                      height="160"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "low"}
                      decoding={index === 0 ? "sync" : "async"}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 h-6 w-6 md:h-8 md:w-8" />
        <CarouselNext className="right-2 h-6 w-6 md:h-8 md:w-8" />
      </Carousel>
    </div>
  );
};

export default CompactBannerCarousel;
