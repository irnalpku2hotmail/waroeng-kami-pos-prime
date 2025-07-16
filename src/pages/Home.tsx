
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HomeNavbar from '@/components/home/HomeNavbar';
import FrontendHero from '@/components/frontend/FrontendHero';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import HomeFlashSale from '@/components/home/HomeFlashSale';
import BestSellingProducts from '@/components/home/BestSellingProducts';
import RecentlyBoughtProducts from '@/components/home/RecentlyBoughtProducts';
import ProductCarousel from '@/components/home/ProductCarousel';
import HomeFooter from '@/components/home/HomeFooter';
import CartModal from '@/components/CartModal';
import LocationPicker from '@/components/home/LocationPicker';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cartModalOpen, setCartModalOpen] = useState(false);

  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['store_name', 'store_address', 'store_phone', 'store_email']);
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  // Check if user has location set
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('latitude, longitude, address_text')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const storeName = settings?.store_name?.name || 'Waroeng Kami';

  // Transform settings to StoreInfo format
  const storeInfo: StoreInfo = {
    name: settings?.store_name?.name || 'Waroeng Kami',
    address: settings?.store_address?.address || '',
    phone: settings?.store_phone?.phone || '',
    email: settings?.store_email?.email || ''
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };

  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    console.log('Location:', { lat, lng, address });
  };

  const handleProductClick = (product: any) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar
        storeInfo={storeInfo}
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      {/* Location Picker for authenticated users */}
      {user && (
        <div className="bg-white border-b py-2">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {userProfile?.address_text ? (
                <span className="text-sm text-gray-600">
                  📍 {userProfile.address_text.slice(0, 50)}...
                </span>
              ) : (
                <span className="text-sm text-gray-600">📍 Lokasi belum diset</span>
              )}
            </div>
            <LocationPicker onLocationSelect={handleLocationSelect} />
          </div>
        </div>
      )}

      <FrontendHero storeName={storeName} />
      
      {/* Categories Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Kategori Produk</h2>
          </div>
          <HomeCategoriesSlider onCategorySelect={handleCategorySelect} />
        </div>
      </section>

      {/* Flash Sale Section */}
      <HomeFlashSale onProductClick={handleProductClick} />

      {/* Best Selling Products */}
      <BestSellingProducts onProductClick={handleProductClick} />

      {/* Recently Bought Products */}
      <RecentlyBoughtProducts onProductClick={handleProductClick} />

      {/* All Products */}
      <ProductCarousel onProductClick={handleProductClick} />

      <HomeFooter />
      
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default Home;
