import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import HomeFooter from '@/components/home/HomeFooter';
import ProductGrid from '@/components/home/ProductGrid';
import LocationPermissionModal from '@/components/home/LocationPermissionModal';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Home = () => {
  const { user } = useAuth();
  const { setCustomerInfo, setShippingCost } = useCart();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  // Fetch frontend images for carousel
  const { data: frontendImages = [] } = useQuery({
    queryKey: ['frontend-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'frontend_settings')
        .single();
      
      if (error || !data?.value) return [];
      
      // Type guard to ensure we have the correct structure
      const settingsValue = data.value;
      if (typeof settingsValue === 'object' && settingsValue !== null && 'banner_urls' in settingsValue) {
        const bannerUrls = (settingsValue as any).banner_urls;
        return Array.isArray(bannerUrls) ? bannerUrls : [];
      }
      
      return [];
    }
  });

  // Fetch COD settings and sync with cart
  const { data: codSettings } = useQuery({
    queryKey: ['cod-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'cod_settings')
        .single();
      if (error) {
        console.log('No COD settings found, using defaults');
        return { enabled: true, delivery_fee: 10000, min_order: 50000 };
      }
      return data.value;
    }
  });

  // Request location permission on page load
  useEffect(() => {
    const checkLocationPermission = async () => {
      if (!user) return;
      
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'prompt') {
          setShowLocationModal(true);
        } else if (result.state === 'granted') {
          getCurrentLocation();
        }
      } catch (error) {
        console.log('Geolocation not supported');
      }
    };

    checkLocationPermission();
  }, [user]);

  // Auto-rotate carousel with play/pause functionality
  useEffect(() => {
    if (frontendImages.length > 1 && isAutoPlay && isPlaying) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % frontendImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [frontendImages.length, isAutoPlay, isPlaying]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (user) {
          try {
            // Save location to database
            const { error } = await supabase
              .from('user_locations')
              .upsert({
                user_id: user.id,
                latitude,
                longitude,
                is_primary: true
              });
            
            if (error) console.error('Error saving location:', error);
          } catch (error) {
            console.error('Error saving location:', error);
          }
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  };

  // Sync user profile with cart customer info
  useEffect(() => {
    if (user && setCustomerInfo) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setCustomerInfo({
              name: profile.full_name || '',
              phone: profile.phone || '',
              email: profile.email || user.email || '',
              address: profile.address || ''
            });
          }
        });
    }
  }, [user, setCustomerInfo]);

  // Sync COD settings with cart
  useEffect(() => {
    if (codSettings && setShippingCost) {
      const deliveryFee = typeof codSettings === 'object' && codSettings !== null && 'delivery_fee' in codSettings 
        ? (codSettings as any).delivery_fee 
        : 10000;
      setShippingCost(deliveryFee);
    }
  }, [codSettings, setShippingCost]);

  const handleProductClick = (product: any) => {
    navigate(`/product/${product.id}`);
  };

  const handleSearchProduct = (product: any) => {
    navigate(`/product/${product.id}`);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % frontendImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + frontendImages.length) % frontendImages.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const storeInfo = settings?.store_info || {};
  const storeName = storeInfo.name || 'TokoQu';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navbar */}
      <HomeNavbar
        storeName={storeName}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onProductSelect={handleSearchProduct}
      />

      {/* Enhanced Hero Carousel */}
      {frontendImages.length > 0 && (
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1">
            <div className="relative h-80 md:h-96 overflow-hidden rounded-3xl bg-white">
              {frontendImages.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              ))}
              
              {/* Enhanced Navigation Controls */}
              {frontendImages.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevImage}
                    className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white border-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextImage}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white border-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </Button>
                  
                  {/* Play/Pause Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={togglePlayPause}
                    className="absolute top-6 right-6 bg-white/90 hover:bg-white border-0 shadow-lg backdrop-blur-sm transition-all duration-300"
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 text-gray-700" />
                    ) : (
                      <Play className="h-4 w-4 text-gray-700" />
                    )}
                  </Button>
                  
                  {/* Enhanced Dots Indicator */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                    {frontendImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`transition-all duration-300 rounded-full border-2 border-white/50 ${
                          index === currentImageIndex 
                            ? 'w-12 h-3 bg-white' 
                            : 'w-3 h-3 bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
                    <div 
                      className="h-full bg-white transition-all duration-100 ease-linear"
                      style={{ 
                        width: `${((currentImageIndex + 1) / frontendImages.length) * 100}%` 
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Categories Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Kategori Produk
          </h2>
          <HomeCategoriesSlider
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>
      </div>

      {/* Enhanced Products Section */}
      <div className="py-12 bg-white/50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Produk Pilihan
          </h2>
          <ProductGrid
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            onProductClick={handleProductClick}
          />
        </div>
      </div>

      {/* Footer */}
      <HomeFooter />

      {/* Location Permission Modal */}
      <LocationPermissionModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        onAllow={() => {
          getCurrentLocation();
          setShowLocationModal(false);
        }}
        onDeny={() => setShowLocationModal(false)}
      />
    </div>
  );
};

export default Home;
