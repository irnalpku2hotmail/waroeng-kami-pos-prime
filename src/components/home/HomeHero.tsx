
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ShoppingBag, Star, Zap, Play, Pause } from 'lucide-react';

interface HomeHeroProps {
  storeName: string;
  storeDescription?: string;
}

interface CarouselImage {
  title?: string;
  subtitle?: string;
  image_url: string;
  cta_text?: string;
}

interface FrontendSettings {
  carousel_images?: CarouselImage[];
}

const HomeHero = ({ storeName, storeDescription }: HomeHeroProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Fetch frontend settings for carousel images
  const { data: settings } = useQuery({
    queryKey: ['frontend-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'frontend_settings')
        .single();
      if (error) {
        console.log('No frontend settings found');
        return null;
      }
      return data.value as FrontendSettings;
    }
  });

  const carouselImages = (settings as FrontendSettings)?.carousel_images || [];

  const slides = carouselImages.length > 0 ? carouselImages.map((image: CarouselImage, index: number) => ({
    id: index + 1,
    title: image.title || `Selamat Datang di ${storeName}`,
    subtitle: image.subtitle || storeDescription || "Temukan produk berkualitas dengan harga terbaik",
    image: image.image_url,
    cta: image.cta_text || "Belanja Sekarang",
    bgGradient: index === 0 ? "from-blue-500 to-purple-600" : index === 1 ? "from-red-500 to-orange-500" : "from-green-500 to-teal-500"
  })) : [
    {
      id: 1,
      title: `Selamat Datang di ${storeName}`,
      subtitle: storeDescription || "Temukan produk berkualitas dengan harga terbaik",
      image: "/api/placeholder/1200/400",
      cta: "Belanja Sekarang",
      bgGradient: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      title: "Flash Sale Hari Ini!",
      subtitle: "Dapatkan diskon hingga 50% untuk produk pilihan",
      image: "/api/placeholder/1200/400",
      cta: "Lihat Penawaran",
      bgGradient: "from-red-500 to-orange-500"
    },
    {
      id: 3,
      title: "Produk Terbaru",
      subtitle: "Koleksi terlengkap dan terpercaya untuk kebutuhan Anda",
      image: "/api/placeholder/1200/400",
      cta: "Jelajahi Produk",
      bgGradient: "from-green-500 to-teal-500"
    }
  ];

  useEffect(() => {
    if (!isAutoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isAutoPlay]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative h-80 md:h-96 overflow-hidden mx-4 my-6 rounded-2xl shadow-2xl group">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
            index === currentSlide ? 'translate-x-0 opacity-100 scale-100' : 
            index < currentSlide ? '-translate-x-full opacity-0 scale-95' : 'translate-x-full opacity-0 scale-95'
          }`}
        >
          <div className={`h-full bg-gradient-to-r ${slide.bgGradient} relative overflow-hidden`}>
            {slide.image && slide.image !== "/api/placeholder/1200/400" && (
              <div className="absolute inset-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-20" />
            <div className="relative h-full flex items-center justify-center">
              <div className="text-center text-white px-6 max-w-4xl">
                <div className="mb-6 flex justify-center">
                  {index === 1 && <Zap className="h-8 w-8 animate-pulse text-yellow-400" />}
                  {index === 2 && <Star className="h-8 w-8 text-yellow-400" />}
                  {index === 0 && <ShoppingBag className="h-8 w-8 text-white" />}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in leading-tight">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
                  {slide.subtitle}
                </p>
                <Button 
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 text-lg shadow-xl transform hover:scale-105 transition-all duration-300 rounded-full"
                >
                  {slide.cta}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Auto-play control */}
      <button
        onClick={() => setIsAutoPlay(!isAutoPlay)}
        className="absolute top-6 right-6 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
      >
        {isAutoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? 'w-8 h-3 bg-white' 
                : 'w-3 h-3 bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-6 right-6 bg-black/30 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};

export default HomeHero;
