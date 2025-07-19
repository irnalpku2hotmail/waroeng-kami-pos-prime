
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import HomeNavbar from '@/components/home/HomeNavbar';
import BannerCarousel from '@/components/home/BannerCarousel';
import EnhancedCategoriesSlider from '@/components/home/EnhancedCategoriesSlider';
import EnhancedFlashSale from '@/components/home/EnhancedFlashSale';
import ProductGrid from '@/components/home/ProductGrid';
import HomeFooter from '@/components/home/HomeFooter';
import InteractiveLocationPicker from '@/components/home/InteractiveLocationPicker';
import PurchaseHistorySlider from '@/components/home/PurchaseHistorySlider';
import BestSellingSlider from '@/components/home/BestSellingSlider';
import CartModal from '@/components/CartModal';
import { useState } from 'react';

const Home = () => {
  const { user } = useAuth();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // Fetch featured products with search and category filter
  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .eq('is_active', true);

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,categories.name.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    }
  });

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setSearchTerm(categoryName); // Set search term to show what's being filtered
  };

  const handleSearch = () => {
    // Search functionality is handled by the query above
    console.log('Searching for:', searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
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
        
        {/* Interactive Location Picker */}
        <div className="mb-8">
          <InteractiveLocationPicker />
        </div>
        
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
        
        {/* Featured Products */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory ? `Produk ${searchTerm}` : 'Produk Pilihan'}
            </h2>
            <div className="flex gap-2">
              {selectedCategory && (
                <button 
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Hapus Filter
                </button>
              )}
              <a 
                href="/products" 
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Lihat Semua
              </a>
            </div>
          </div>
          <ProductGrid products={featuredProducts || []} />
        </div>
      </main>

      {/* Footer */}
      <HomeFooter />

      {/* Cart Modal */}
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default Home;
