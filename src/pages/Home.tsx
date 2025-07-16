
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import HomeNavbar from '@/components/home/HomeNavbar';
import BannerCarousel from '@/components/home/BannerCarousel';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import HomeFlashSale from '@/components/home/HomeFlashSale';
import ProductGrid from '@/components/home/ProductGrid';
import HomeFooter from '@/components/home/HomeFooter';
import LocationPermissionModal from '@/components/home/LocationPermissionModal';
import CartModal from '@/components/CartModal';
import { useState } from 'react';

const Home = () => {
  const { user } = useAuth();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch flash sales
  const { data: flashSales } = useQuery({
    queryKey: ['active-flash-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items (
            *,
            products (*)
          )
        `)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Fetch featured products
  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Banner Carousel */}
        <BannerCarousel />
        
        {/* Categories Slider */}
        <HomeCategoriesSlider />
        
        {/* Flash Sale Section */}
        {flashSales && flashSales.length > 0 && (
          <div className="mb-8">
            <HomeFlashSale flashSales={flashSales} />
          </div>
        )}
        
        {/* Featured Products */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Produk Pilihan</h2>
            <a 
              href="/products" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat Semua
            </a>
          </div>
          <ProductGrid products={featuredProducts || []} />
        </div>
      </main>

      {/* Footer */}
      <HomeFooter />
      
      {/* Location Permission Modal */}
      <LocationPermissionModal 
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
      />

      {/* Cart Modal */}
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default Home;
