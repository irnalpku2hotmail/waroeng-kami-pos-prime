import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeHero from '@/components/home/HomeHero';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import ProductCarousel from '@/components/home/ProductCarousel';
import FlashSaleCarousel from '@/components/home/FlashSaleCarousel';
import BestSellingProducts from '@/components/home/BestSellingProducts';
import RecentlyBoughtProducts from '@/components/home/RecentlyBoughtProducts';
import HomeFooter from '@/components/home/HomeFooter';
import LocationPermissionModal from '@/components/home/LocationPermissionModal';
import ProductGrid from '@/components/home/ProductGrid';
import FrontendCartModal from '@/components/frontend/FrontendCartModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
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

  const handleProductClick = (product: any) => {
    navigate(`/product/${product.id}`);
  };

  const handleLocationAllow = () => {
    console.log('Location access allowed');
  };

  const handleLocationDeny = () => {
    console.log('Location access denied');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() || selectedCategory) {
      navigate(`/search?${searchTerm.trim() ? `q=${encodeURIComponent(searchTerm.trim())}` : ''}${selectedCategory ? `${searchTerm.trim() ? '&' : ''}category=${selectedCategory}` : ''}`);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };

  const resetSearch = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setShowSearchResults(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <HomeNavbar 
        storeInfo={storeInfo} 
        onCartClick={() => setCartModalOpen(true)}
      />
      
      <main className="bg-white">
        {/* Hero Section with Banner/Slider */}
        <HomeHero 
          storeName={storeInfo?.name}
          storeDescription="Temukan produk berkualitas dengan harga terbaik"
          onProductClick={handleProductClick}
        />

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Enhanced Search Bar */}
          <section className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-full border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <Button type="submit" className="rounded-full px-6">
                Cari
              </Button>
            </form>
          </section>

          {/* Categories Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Kategori Produk
            </h2>
            <HomeCategoriesSlider onCategorySelect={handleCategorySelect} />
          </section>

          {/* Flash Sale Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              ⚡ Flash Sale
            </h2>
            <FlashSaleCarousel onProductClick={handleProductClick} />
          </section>

          {/* Best Selling Products */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              🏆 Produk Terlaris
            </h2>
            <BestSellingProducts onProductClick={handleProductClick} />
          </section>

          {/* Recently Bought Products */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              🔄 Beli Lagi
            </h2>
            <RecentlyBoughtProducts onProductClick={handleProductClick} />
          </section>

          {/* All Products Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
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
