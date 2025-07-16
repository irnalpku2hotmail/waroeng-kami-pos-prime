
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ShoppingBag, Star, Zap, Play, Pause } from 'lucide-react';

interface FrontendHeroProps {
  storeName: string;
  storeDescription?: string;
  frontendSettings?: any;
}

const FrontendHero = ({ storeName, storeDescription, frontendSettings }: FrontendHeroProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Get carousel images from frontend settings
  const carouselImages = frontendSettings?.banner_urls || [];

  const slides = carouselImages.length > 0 ? carouselImages.map((imageUrl: string, index: number) => ({
    id: index + 1,
    title: `Selamat Datang di ${storeName}`,
    subtitle: storeDescription || "Temukan produk berkualitas dengan harga terbaik",
    image: imageUrl,
    cta: "Belanja Sekarang",
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
    if (!isAutoPlay || slides.length <= 1) return;
    
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

  if (slides.length === 0) {
    return (
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden mx-4 my-6 rounded-2xl shadow-2xl bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-4xl">
            <div className="mb-6 flex justify-center">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 animate-fade-in leading-tight">
              Selamat Datang di {storeName}
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
              {storeDescription || "Temukan produk berkualitas dengan harga terbaik"}
            </p>
            <Button 
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 md:px-8 py-2 md:py-3 text-base md:text-lg shadow-xl transform hover:scale-105 transition-all duration-300 rounded-full"
            >
              Belanja Sekarang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden mx-4 my-6 rounded-2xl shadow-2xl group">
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
              <div className="text-center text-white px-4 md:px-6 max-w-4xl">
                <div className="mb-4 md:mb-6 flex justify-center">
                  {index === 1 && <Zap className="h-6 w-6 md:h-8 md:w-8 animate-pulse text-yellow-400" />}
                  {index === 2 && <Star className="h-6 w-6 md:h-8 md:w-8 text-yellow-400" />}
                  {index === 0 && <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-white" />}
                </div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 animate-fade-in leading-tight">
                  {slide.title}
                </h1>
                <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
                  {slide.subtitle}
                </p>
                <Button 
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 md:px-8 py-2 md:py-3 text-base md:text-lg shadow-xl transform hover:scale-105 transition-all duration-300 rounded-full"
                >
                  {slide.cta}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons - Only show if more than 1 slide */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 md:p-3 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 md:p-3 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
          </button>

          {/* Auto-play control */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="absolute top-4 md:top-6 right-4 md:right-6 bg-black/30 hover:bg-black/50 text-white p-1.5 md:p-2 rounded-full transition-all duration-300 backdrop-blur-sm opacity-0 group-hover:opacity-100"
          >
            {isAutoPlay ? <Pause className="h-3 w-3 md:h-4 md:w-4" /> : <Play className="h-3 w-3 md:h-4 md:w-4" />}
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide 
                    ? 'w-6 md:w-8 h-2 md:h-3 bg-white' 
                    : 'w-2 md:w-3 h-2 md:h-3 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>

          {/* Slide counter */}
          <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 bg-black/30 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm backdrop-blur-sm">
            {currentSlide + 1} / {slides.length}
          </div>
        </>
      )}
    </div>
  );
};

export default FrontendHero;
