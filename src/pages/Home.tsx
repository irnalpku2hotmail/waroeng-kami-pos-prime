
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
import { Package } from 'lucide-react';

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
        
        {/* Enhanced Flash Sale Section */}
        {flashSales && flashSales.length > 0 && (
          <EnhancedFlashSale flashSales={flashSales} />
        )}
        
        {/* Purchase History Slider */}
        <PurchaseHistorySlider />
        
        {/* Best Selling Slider */}
        <BestSellingSlider />
        
        {/* Featured Products - Enhanced Design */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedCategory ? `Produk ${searchTerm}` : 'Produk Pilihan'}
              </h2>
              <p className="text-gray-600">
                {selectedCategory ? 'Produk terbaik dari kategori yang dipilih' : 'Rekomendasi produk terbaik untuk Anda'}
              </p>
            </div>
            {selectedCategory && (
              <button 
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Hapus Filter
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featuredProducts?.map((product) => (
              <Link 
                to={`/product/${product.id}`} 
                key={product.id} 
                className="group bg-white rounded-2xl shadow-lg p-4 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
              >
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="space-y-2">
                  {product.categories && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {product.categories.name}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="font-bold text-sm line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="space-y-1">
                    <p className="text-blue-600 font-bold text-lg">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(product.selling_price)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        product.current_stock > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
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
