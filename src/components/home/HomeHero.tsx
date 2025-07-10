
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

  // Fetch featured products for the slider
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    }
  });

  const carouselImages = (settings as FrontendSettings)?.carousel_images || [];

  // Create slides from carousel images and featured products
  const slides = carouselImages.length > 0 ? carouselImages.map((image: CarouselImage, index: number) => ({
    id: index + 1,
    title: image.title || `Selamat Datang di ${storeName}`,
    subtitle: image.subtitle || storeDescription || "Temukan produk berkualitas dengan harga terbaik",
    image: image.image_url,
    cta: image.cta_text || "Belanja Sekarang",
    bgGradient: index === 0 ? "from-blue-600 to-purple-700" : index === 1 ? "from-emerald-500 to-blue-600" : "from-orange-500 to-red-600",
    type: 'banner'
  })) : [];

  // Add featured products as slides
  const productSlides = featuredProducts.map((product: any, index: number) => ({
    id: `product-${product.id}`,
    title: product.name,
    subtitle: `Hanya Rp ${product.selling_price.toLocaleString('id-ID')} - ${product.categories?.name || 'Produk Unggulan'}`,
    image: product.image_url || '/placeholder.svg',
    cta: "Beli Sekarang",
    bgGradient: "from-slate-800 to-slate-900",
    type: 'product',
    product: product
  }));

  const allSlides = [...slides, ...productSlides];

  // If no slides, create default slides
  const finalSlides = allSlides.length > 0 ? allSlides : [
    {
      id: 1,
      title: `Selamat Datang di ${storeName}`,
      subtitle: storeDescription || "Temukan produk berkualitas dengan harga terbaik",
      image: "/api/placeholder/1200/400",
      cta: "Belanja Sekarang",
      bgGradient: "from-blue-600 to-purple-700",
      type: 'banner'
    },
    {
      id: 2,
      title: "Produk Terlaris",
      subtitle: "Dapatkan produk favorit pelanggan dengan kualitas terbaik",
      image: "/api/placeholder/1200/400",
      cta: "Lihat Produk",
      bgGradient: "from-emerald-500 to-blue-600",
      type: 'banner'
    },
    {
      id: 3,
      title: "Promo Spesial",
      subtitle: "Nikmati berbagai penawaran menarik setiap harinya",
      image: "/api/placeholder/1200/400",
      cta: "Jelajahi Promo",
      bgGradient: "from-orange-500 to-red-600",
      type: 'banner'
    }
  ];

  useEffect(() => {
    if (!isAutoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % finalSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [finalSlides.length, isAutoPlay]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % finalSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + finalSlides.length) % finalSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative h-96 md:h-[500px] overflow-hidden mx-4 my-8 rounded-3xl shadow-2xl group">
      {finalSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
            index === currentSlide ? 'translate-x-0 opacity-100 scale-100' : 
            index < currentSlide ? '-translate-x-full opacity-0 scale-95' : 'translate-x-full opacity-0 scale-95'
          }`}
        >
          <div className={`h-full bg-gradient-to-br ${slide.bgGradient} relative overflow-hidden`}>
            {slide.image && slide.image !== "/api/placeholder/1200/400" && (
              <div className="absolute inset-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
              </div>
            )}
            
            <div className="relative h-full">
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-8">
                  <div className="max-w-2xl text-white">
                    <div className="mb-6 flex items-center gap-3">
                      {slide.type === 'product' && <Star className="h-6 w-6 text-yellow-400" />}
                      {slide.type === 'banner' && index === 1 && <Zap className="h-6 w-6 animate-pulse text-yellow-400" />}
                      {slide.type === 'banner' && index === 0 && <ShoppingBag className="h-6 w-6 text-white" />}
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                      {slide.title}
                    </h1>
                    
                    <p className="text-lg md:text-xl mb-8 opacity-95 leading-relaxed max-w-xl">
                      {slide.subtitle}
                    </p>
                    
                    <div className="flex gap-4">
                      <Button 
                        size="lg"
                        className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-xl transform hover:scale-105 transition-all duration-300 rounded-full"
                      >
                        {slide.cta}
                      </Button>
                      
                      {slide.type === 'product' && 'product' in slide && (
                        <Button 
                          size="lg"
                          variant="outline"
                          className="border-white text-white hover:bg-white hover:text-gray-900 font-semibold px-8 py-4 text-lg rounded-full backdrop-blur-sm"
                        >
                          Lihat Detail
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Auto-play control */}
      <button
        onClick={() => setIsAutoPlay(!isAutoPlay)}
        className="absolute top-6 right-6 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
      >
        {isAutoPlay ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {finalSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? 'w-12 h-4 bg-white shadow-lg' 
                : 'w-4 h-4 bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-6 right-6 bg-black/30 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm font-medium">
        {currentSlide + 1} / {finalSlides.length}
      </div>
    </div>
  );
};

export default HomeHero;
