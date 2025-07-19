
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HomeNavbar from '@/components/home/HomeNavbar';
import FrontendHero from '@/components/frontend/FrontendHero';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import ProductCarousel from '@/components/home/ProductCarousel';
import FlashSaleCarousel from '@/components/home/FlashSaleCarousel';
import BestSellingProducts from '@/components/home/BestSellingProducts';
import RecentlyBoughtProducts from '@/components/home/RecentlyBoughtProducts';
import HomeFooter from '@/components/home/HomeFooter';
import LocationPermissionModal from '@/components/home/LocationPermissionModal';
import FrontendCartModal from '@/components/frontend/FrontendCartModal';

const Home = () => {
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartModalOpen, setCartModalOpen] = useState(false);

  // Check for location permission on component mount
  useEffect(() => {
    const checkLocationPermission = async () => {
      if ('geolocation' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'prompt') {
            setShowLocationModal(true);
          } else if (permission.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('Location:', position.coords);
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

      const extractStringValue = (value: any, defaultValue: string): string => {
        if (!value) return defaultValue;
        
        if (typeof value === 'object' && value !== null) {
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
          return defaultValue;
        }
        
        if (typeof value === 'string') {
          return value;
        }
        
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

  // Fetch frontend settings for banner
  const { data: frontendSettings } = useQuery({
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
      return data.value;
    }
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

  const handleCategorySelect = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <HomeNavbar 
        storeInfo={storeInfo} 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />
      
      <main className="bg-white">
        {/* Hero Section with Banner from Frontend Settings */}
        <FrontendHero 
          storeName={storeInfo?.name || 'Waroeng Kami'}
          storeDescription="Temukan produk berkualitas dengan harga terbaik"
          frontendSettings={frontendSettings}
        />

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Categories Section */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
              Kategori Produk
            </h2>
            <HomeCategoriesSlider onCategorySelect={handleCategorySelect} />
          </section>

          {/* Flash Sale Section */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
              ⚡ Flash Sale
            </h2>
            <FlashSaleCarousel onProductClick={handleProductClick} />
          </section>

          {/* Best Selling Products */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
              🏆 Produk Terlaris
            </h2>
            <BestSellingProducts onProductClick={handleProductClick} />
          </section>

          {/* Recently Bought Products */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
              🔄 Beli Lagi
            </h2>
            <RecentlyBoughtProducts onProductClick={handleProductClick} />
          </section>

          {/* All Products Section */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">
              Semua Produk
            </h2>
            <ProductCarousel onProductClick={handleProductClick} />
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

      <FrontendCartModal 
        open={cartModalOpen} 
        onOpenChange={setCartModalOpen} 
      />
    </div>
  );
};

export default Home;
