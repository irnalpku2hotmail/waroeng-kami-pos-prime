
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
import PurchaseHistorySlider from '@/components/home/PurchaseHistorySlider';
import BestSellingSlider from '@/components/home/BestSellingSlider';
import CartModal from '@/components/CartModal';
import ShippingInfoDisplay from '@/components/home/ShippingInfoDisplay';
import BrandCarousel from '@/components/BrandCarousel';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

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
    queryKey: ['featured-products', searchTerm, selectedCategory, showAllProducts],
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
        .limit(showAllProducts ? 50 : 10);

      if (error) throw error;
      return data;
    }
  });

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setSearchTerm(categoryName);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setShowAllProducts(false);
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
        
        {/* Shipping Info Display */}
        <ShippingInfoDisplay />
        
        {/* Enhanced Categories Slider */}
        <EnhancedCategoriesSlider onCategorySelect={handleCategorySelect} />
        
        {/* Brand Carousel */}
        <BrandCarousel />
        
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
              {!showAllProducts && featuredProducts && featuredProducts.length >= 10 && (
                <button
                  onClick={() => setShowAllProducts(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Lihat Lebih Banyak
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
