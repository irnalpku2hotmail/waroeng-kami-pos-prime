
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import HomeNavbar from '@/components/home/HomeNavbar';
import BannerCarousel from '@/components/home/BannerCarousel';
import EnhancedCategoriesSlider from '@/components/home/EnhancedCategoriesSlider';
import EnhancedFlashSale from '@/components/home/EnhancedFlashSale';
import PurchaseHistorySlider from '@/components/home/PurchaseHistorySlider';
import BestSellingSlider from '@/components/home/BestSellingSlider';
import ProductSearchSection from '@/components/home/ProductSearchSection';
import CompactProductGrid from '@/components/home/CompactProductGrid';
import CartModal from '@/components/CartModal';
import EnhancedShippingInfo from '@/components/home/EnhancedShippingInfo';
import EnhancedFooter from '@/components/home/EnhancedFooter';

const Home = () => {
  const { user } = useAuth();
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

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    // This will be handled by the search component
    console.log('Category selected:', categoryId, categoryName);
  };

  const handleSearch = () => {
    console.log('Searching for:', searchTerm);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Banner Carousel */}
        <BannerCarousel />
        
        {/* Enhanced Shipping Info Display */}
        <EnhancedShippingInfo />
        
        {/* Enhanced Categories Slider */}
        <EnhancedCategoriesSlider onCategorySelect={handleCategorySelect} />
        
        {/* Enhanced Flash Sale Section */}
        {flashSales && flashSales.length > 0 && (
          <EnhancedFlashSale flashSales={flashSales} />
        )}
        
        {/* Purchase History Slider */}
        <PurchaseHistorySlider />
        
        {/* Best Selling Slider */}
        <BestSellingSlider />
        
        {/* Product Search Section */}
        <ProductSearchSection />
        
        {/* Compact Product Grid */}
        <CompactProductGrid />
      </main>

      {/* Enhanced Footer */}
      <EnhancedFooter />

      {/* Cart Modal */}
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default Home;
