
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeHero from '@/components/home/HomeHero';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import ProductCarousel from '@/components/home/ProductCarousel';
import FlashSaleCarousel from '@/components/home/FlashSaleCarousel';
import OrderHistory from '@/components/home/OrderHistory';
import HomeFooter from '@/components/home/HomeFooter';
import LocationPermissionModal from '@/components/home/LocationPermissionModal';

const Home = () => {
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Check for location permission on component mount
  useEffect(() => {
    const checkLocationPermission = async () => {
      if ('geolocation' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'prompt') {
            setShowLocationModal(true);
          } else if (permission.state === 'granted') {
            // Optionally get and store location
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('Location:', position.coords);
                // Store location if needed
              },
              (error) => {
                console.log('Location error:', error);
              }
            );
          }
        } catch (error) {
          console.log('Permission query error:', error);
        }
      }
    };

    checkLocationPermission();
  }, []);

  const { data: storeInfo } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['store_name', 'store_address', 'store_phone', 'store_email']);

      if (error) throw error;

      const settings: Record<string, any> = {};
      data.forEach(setting => {
        settings[setting.key] = setting.value;
      });

      // Helper function to safely extract string values from potentially object values
      const extractStringValue = (value: any, defaultValue: string): string => {
        if (!value) return defaultValue;
        
        if (typeof value === 'object' && value !== null) {
          // Check if it has common properties like name, email, address, phone
          if ('name' in value && typeof value.name === 'string') {
            return value.name;
          }
          if ('email' in value && typeof value.email === 'string') {
            return value.email;
          }
          if ('address' in value && typeof value.address === 'string') {
            return value.address;
          }
          if ('phone' in value && typeof value.phone === 'string') {
            return value.phone;
          }
          // If it's an object but doesn't have expected properties, return default
          return defaultValue;
        }
        
        if (typeof value === 'string') {
          return value;
        }
        
        // Convert any other type to string safely
        return String(value) || defaultValue;
      };

      return {
        name: extractStringValue(settings.store_name, 'Waroeng Kami'),
        address: extractStringValue(settings.store_address, 'Jl. Contoh No. 123, Jakarta'),
        phone: extractStringValue(settings.store_phone, '+62 812-3456-7890'),
        email: extractStringValue(settings.store_email, 'info@waroengkami.com')
      };
    },
  });

  const handleProductClick = (product: any) => {
    navigate(`/product/${product.id}`);
  };

  const handleLocationAllow = () => {
    console.log('Location access allowed');
  };

  const handleLocationDeny = () => {
    console.log('Location access denied');
  };

  return (
    <div className="min-h-screen bg-white">
      <HomeNavbar />
      
      <main className="bg-white">
        <HomeHero 
          storeName={storeInfo?.name}
          onProductClick={handleProductClick}
        />
        
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Categories Section */}
          <section>
            <HomeCategoriesSlider />
          </section>

          {/* Flash Sale Section */}
          <section>
            <FlashSaleCarousel />
          </section>

          {/* Products Section */}
          <section>
            <ProductCarousel />
          </section>

          {/* Order History Section */}
          <section>
            <OrderHistory />
          </section>
        </div>
      </main>

      <HomeFooter storeInfo={storeInfo} />
      
      <LocationPermissionModal 
        open={showLocationModal} 
        onOpenChange={setShowLocationModal}
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />
    </div>
  );
};

export default Home;
