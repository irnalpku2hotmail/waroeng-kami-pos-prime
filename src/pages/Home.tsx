
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
import CartModal from '@/components/CartModal';
import EnhancedShippingInfo from '@/components/home/EnhancedShippingInfo';
import EnhancedFooter from '@/components/home/EnhancedFooter';

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
        .limit(16);

      if (error) throw error;
      return data;
    }
  });

  const handleCategorySelect = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    setSearchTerm(categoryName);
  };

  const handleSearch = () => {
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
        
        {/* Enhanced Shipping Info Display */}
        <EnhancedShippingInfo />
        
        {/* Enhanced Categories Slider */}
        <EnhancedCategoriesSlider onCategorySelect={handleCategorySelect} />
        
        {/* Enhanced Flash Sale Section - Smaller Display */}
        {flashSales && flashSales.length > 0 && (
          <div className="mb-8">
            <EnhancedFlashSale flashSales={flashSales} />
          </div>
        )}
        
        {/* Purchase History Slider */}
        <PurchaseHistorySlider />
        
        {/* Best Selling Slider */}
        <BestSellingSlider />
        
        {/* Featured Products - Smaller Grid */}
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
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {featuredProducts?.map((product) => (
              <Link 
                to={`/products/${product.id}`} 
                key={product.id} 
                className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                <p className="text-blue-600 font-bold text-sm">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(product.selling_price)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Enhanced Footer */}
      <EnhancedFooter />

      {/* Cart Modal */}
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default Home;
