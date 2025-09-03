
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BannerCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Static primary banner for immediate LCP
  const primaryBanner = 'https://storage.googleapis.com/company-profile-b7/1731662827256-50babe33-0abb-4ee3-aab6-91ffaa96b782.jpg';

  // Fetch banner settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['banner-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['banner_images', 'banner_enabled']);
      
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  // Default banner images if none configured
  const defaultBanners = [
    primaryBanner,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=300&fit=crop'
  ];

  // Use static primary banner immediately, then switch to dynamic data when loaded
  const bannerImages = !isLoading && settings?.banner_images ? settings.banner_images : defaultBanners;
  const isBannerEnabled = settings?.banner_enabled !== false;

  // Auto-slide every 7 seconds
  useEffect(() => {
    if (!isBannerEnabled || !bannerImages.length) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [bannerImages.length, isBannerEnabled]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  if (!isBannerEnabled || !bannerImages.length) {
    return null;
  }

  return (
    <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
      {/* Carousel Container */}
      <div className="relative h-full">
        {/* Slides */}
        <div 
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ 
            transform: `translateX(-${currentSlide * 100}%)`,
            filter: 'brightness(1.1) contrast(1.1)'
          }}
        >
          {bannerImages.map((image, index) => (
            <div
              key={index}
              className="w-full h-full flex-shrink-0 relative"
              style={{
                transform: `perspective(1000px) rotateY(${Math.abs(index - currentSlide) * 5}deg)`,
                transition: 'transform 0.5s ease-in-out'
              }}
            >
              <img
                src={image}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
                width="1301"
                height="320"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
                decoding={index === 0 ? "sync" : "async"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
        >
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
        >
          <ChevronRight className="h-6 w-6 text-gray-800" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Coverflow Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/10 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/10 to-transparent" />
      </div>
    </div>
  );
};

export default BannerCarousel;
