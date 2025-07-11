
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeHero from '@/components/home/HomeHero';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import HomeFlashSale from '@/components/home/HomeFlashSale';
import HomeFooter from '@/components/home/HomeFooter';
import ProductGrid from '@/components/home/ProductGrid';
import LocationPermissionModal from '@/components/home/LocationPermissionModal';

const Home = () => {
  const { user } = useAuth();
  const { setCustomerInfo, setShippingCost } = useCart();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

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

      {/* Hero Section */}
      <HomeHero 
        storeName={storeName}
        storeDescription={storeDescription}
        onProductClick={handleProductClick}
      />

      {/* Flash Sale Section */}
      <HomeFlashSale onProductClick={handleProductClick} />

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
