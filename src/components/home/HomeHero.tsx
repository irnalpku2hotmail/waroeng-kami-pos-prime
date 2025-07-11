
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HomeHeroProps {
  storeName: string;
  storeDescription?: string;
  onProductClick?: (product: any) => void;
}

const HomeHero = ({ storeName, storeDescription, onProductClick }: HomeHeroProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch featured products for slides
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    }
  });

  // Create slides array with default slides and product slides
  const slides = [
    {
      id: 1,
      title: `Selamat Datang di ${storeName}`,
      subtitle: storeDescription || 'Temukan produk berkualitas dengan harga terbaik',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&h=400&q=80',
      cta: 'Jelajahi Produk',
      bgGradient: 'from-blue-600 to-purple-700',
      type: 'default'
    },
    {
      id: 2,
      title: 'Penawaran Spesial',
      subtitle: 'Dapatkan diskon hingga 50% untuk produk pilihan',
      image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=1200&h=400&q=80',
      cta: 'Lihat Penawaran',
      bgGradient: 'from-orange-500 to-red-600',
      type: 'default'
    },
    ...featuredProducts.map(product => ({
      id: product.id,
      title: product.name,
      subtitle: `Harga: Rp ${product.selling_price.toLocaleString('id-ID')}`,
      image: product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&h=400&q=80',
      cta: 'Lihat Detail',
      bgGradient: 'from-green-500 to-teal-600',
      type: 'product',
      product: product
    }))
  ];

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

  const handleSlideAction = (slide: any) => {
    if (slide.type === 'product' && 'product' in slide && onProductClick) {
      onProductClick(slide.product);
    }
  };

  return (
    <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-75`} />
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-4xl">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
                {slide.title}
              </h1>
              <p className="text-sm md:text-lg lg:text-xl mb-6 opacity-90">
                {slide.subtitle}
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100"
                  onClick={() => handleSlideAction(slide)}
                >
                  {slide.cta}
                </Button>
                
                {slide.type === 'product' && 'product' in slide && (
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-gray-900"
                    onClick={() => handleSlideAction(slide)}
                  >
                    Beli Sekarang
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HomeHero;
