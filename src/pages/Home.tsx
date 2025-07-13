
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

      return {
        name: settings.store_name || 'Waroeng Kami',
        address: settings.store_address || 'Jl. Contoh No. 123, Jakarta',
        phone: settings.store_phone || '+62 812-3456-7890',
        email: settings.store_email || 'info@waroengkami.com'
      };
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <HomeNavbar />
      
      <main className="bg-white">
        <HomeHero />
        
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
      />
    </div>
  );
};

export default Home;
