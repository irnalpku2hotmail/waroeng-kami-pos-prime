
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
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Home = () => {
  const { user } = useAuth();
  const { setCustomerInfo, setShippingCost } = useCart();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        .eq('key', 'frontend_images')
        .single();
      
      if (error || !data) return [];
      return data.value?.images || [];
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

  // Auto-rotate carousel
  useEffect(() => {
    if (frontendImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % frontendImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [frontendImages.length]);

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

  const storeInfo = settings?.store_info || {};
  const storeName = storeInfo.name || 'TokoQu';
  const storeDescription = storeInfo.description;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <HomeNavbar
        storeName={storeName}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onProductSelect={handleSearchProduct}
      />

      {/* Hero Section with Carousel */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Welcome to {storeName}
            </h1>
            {storeDescription && (
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                {storeDescription}
              </p>
            )}
          </div>

          {/* Image Carousel */}
          {frontendImages.length > 0 && (
            <div className="relative max-w-4xl mx-auto mb-8">
              <Card className="overflow-hidden">
                <div className="relative h-64 md:h-96">
                  <img
                    src={frontendImages[currentImageIndex]}
                    alt={`Slide ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {frontendImages.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      {/* Dots indicator */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {frontendImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Categories Slider */}
      <HomeCategoriesSlider
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Products Section */}
      <ProductGrid
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        onProductClick={handleProductClick}
      />

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
