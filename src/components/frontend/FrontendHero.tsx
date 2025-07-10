
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ShoppingBag, Star, Zap } from 'lucide-react';

interface FrontendHeroProps {
  storeName: string;
  storeDescription?: string;
  carouselImages?: string[];
}

const FrontendHero = ({ storeName, storeDescription, carouselImages = [] }: FrontendHeroProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Default slides if no carousel images provided
  const defaultSlides = [
    {
      id: 1,
      title: `Selamat Datang di ${storeName}`,
      subtitle: storeDescription || "Temukan produk berkualitas dengan harga terbaik",
      image: "/api/placeholder/800/400",
      cta: "Belanja Sekarang",
      bgGradient: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      title: "Flash Sale Hari Ini!",
      subtitle: "Dapatkan diskon hingga 50% untuk produk pilihan",
      image: "/api/placeholder/800/400",
      cta: "Lihat Penawaran",
      bgGradient: "from-red-500 to-orange-500"
    },
    {
      id: 3,
      title: "Produk Terbaru",
      subtitle: "Koleksi terlengkap dan terpercaya untuk kebutuhan Anda",
      image: "/api/placeholder/800/400",
      cta: "Jelajahi Produk",
      bgGradient: "from-green-500 to-teal-500"
    }
  ];

  // Use carousel images if provided, otherwise use default slides
  const slides = carouselImages.length > 0 
    ? carouselImages.map((image, index) => ({
        id: index + 1,
        title: index === 0 ? `Selamat Datang di ${storeName}` : `Slide ${index + 1}`,
        subtitle: index === 0 ? (storeDescription || "Temukan produk berkualitas dengan harga terbaik") : "Penawaran menarik untuk Anda",
        image: image,
        cta: "Belanja Sekarang",
        bgGradient: index % 3 === 0 ? "from-blue-500 to-purple-600" : index % 3 === 1 ? "from-red-500 to-orange-500" : "from-green-500 to-teal-500"
      }))
    : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative h-64 md:h-80 overflow-hidden rounded-lg mx-4 my-6 shadow-2xl">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
            index === currentSlide ? 'translate-x-0' : 
            index < currentSlide ? '-translate-x-full' : 'translate-x-full'
          }`}
        >
          <div className={`h-full bg-gradient-to-r ${slide.bgGradient} relative`}>
            {carouselImages.length > 0 && (
              <img 
                src={slide.image} 
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30" />
            <div className="relative h-full flex items-center justify-center">
              <div className="text-center text-white px-6 max-w-4xl">
                <div className="mb-4">
                  {index === 1 && <Zap className="h-6 w-6 mx-auto mb-2 animate-pulse" />}
                  {index === 2 && <Star className="h-6 w-6 mx-auto mb-2" />}
                  {index === 0 && <ShoppingBag className="h-6 w-6 mx-auto mb-2" />}
                </div>
                <h1 className="text-2xl md:text-4xl font-bold mb-3 animate-fade-in">
                  {slide.title}
                </h1>
                <p className="text-base md:text-lg mb-6 opacity-90">
                  {slide.subtitle}
                </p>
                <Button 
                  size="lg" 
                  className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 py-2 text-base shadow-lg transform hover:scale-105 transition-all duration-200"
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
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-110' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default FrontendHero;
