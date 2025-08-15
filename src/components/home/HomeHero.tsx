
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const HomeHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isMobile = useIsMobile();

  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'banners')
        .single();

      if (error || !data?.value) return [];
      return Array.isArray(data.value) ? data.value : [];
    }
  });

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (banners.length === 0) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 text-white ${isMobile ? 'h-48' : 'h-96'}`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex items-center justify-center h-full px-6">
          <div className="text-center">
            <h1 className={`font-bold text-white mb-4 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
              Selamat Datang di Toko Kami
            </h1>
            <p className={`text-blue-100 ${isMobile ? 'text-sm' : 'text-lg'}`}>
              Temukan produk berkualitas dengan harga terbaik
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${isMobile ? 'h-48' : 'h-96'}`}>
      <div className="flex transition-transform duration-500 ease-in-out h-full"
           style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
        {banners.map((banner: any, index: number) => (
          <div key={index} className="w-full flex-shrink-0 relative">
            <img
              src={banner.image_url || '/placeholder.svg'}
              alt={banner.title || 'Banner'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white px-6">
                <h2 className={`font-bold mb-2 ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className={`mb-4 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                    {banner.subtitle}
                  </p>
                )}
                {banner.button_text && banner.button_link && (
                  <Button className="bg-white text-gray-900 hover:bg-gray-100">
                    {banner.button_text}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HomeHero;
