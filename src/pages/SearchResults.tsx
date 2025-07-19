
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Search, Package, Star, Eye, Filter } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import HomeNavbar from '@/components/home/HomeNavbar';
import EnhancedFooter from '@/components/home/EnhancedFooter';
import CartModal from '@/components/CartModal';
import { useState } from 'react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const query = searchParams.get('q') || '';

  // Search products with advanced filtering
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search-products', query, selectedCategory, sortBy],
    queryFn: async () => {
      if (!query.trim()) return [];

      let productsQuery = supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .eq('is_active', true);

      // Apply search filter
      productsQuery = productsQuery.or(`name.ilike.%${query}%,categories.name.ilike.%${query}%`);

      // Apply category filter
      if (selectedCategory) {
        productsQuery = productsQuery.eq('category_id', selectedCategory);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_low':
          productsQuery = productsQuery.order('selling_price', { ascending: true });
          break;
        case 'price_high':
          productsQuery = productsQuery.order('selling_price', { ascending: false });
          break;
        case 'stock':
          productsQuery = productsQuery.order('current_stock', { ascending: false });
          break;
        default:
          productsQuery = productsQuery.order('name');
      }

      const { data, error } = await productsQuery;
      if (error) throw error;
      return data || [];
    },
    enabled: !!query.trim()
  });

  // Get categories for filtering
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Get category-based recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['category-recommendations', searchResults],
    queryFn: async () => {
      if (searchResults.length === 0) return [];

      // Get unique categories from search results
      const categoryIds = [...new Set(searchResults.map(p => p.category_id).filter(Boolean))];
      
      if (categoryIds.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .in('category_id', categoryIds)
        .eq('is_active', true)
        .not('id', 'in', `(${searchResults.map(p => p.id).join(',')})`)
        .limit(8)
        .order('current_stock', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: searchResults.length > 0
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image: product.image_url,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: product.selling_price,
      total_price: product.selling_price * 1,
      product: {
        id: product.id,
        name: product.name,
        image_url: product.image_url
      }
    });

    toast({
      title: 'Berhasil!',
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <HomeNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Hasil Pencarian
              </h1>
              <p className="text-xl text-gray-600 mb-2">"{query}"</p>
              <p className="text-gray-500">
                {searchResults.length} produk ditemukan
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-700">Filter:</span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Nama A-Z</option>
                  <option value="price_low">Harga Terendah</option>
                  <option value="price_high">Harga Tertinggi</option>
                  <option value="stock">Stok Terbanyak</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 max-w-md mx-auto">
              <Search className="h-16 w-16 text-blue-500 mx-auto mb-6 animate-pulse" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Mencari Produk...</h3>
              <p className="text-gray-600">Sedang mencari produk terbaik untuk Anda</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && searchResults.length === 0 && query.trim() && (
          <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 max-w-md mx-auto">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Tidak ada hasil ditemukan
              </h3>
              <p className="text-gray-600 mb-6">
                Coba gunakan kata kunci yang berbeda atau lebih umum
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
              >
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && searchResults.length > 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {searchResults.map((product) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:scale-105 rounded-2xl overflow-hidden"
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      {product.categories && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-blue-600/90 text-white text-xs font-medium px-2 py-1 backdrop-blur-sm">
                            {product.categories.name}
                          </Badge>
                        </div>
                      )}

                      {/* Quick View Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-sm line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      
                      <div className="space-y-2">
                        <p className="text-xl font-bold text-blue-600">
                          {formatPrice(product.selling_price)}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant={product.current_stock > 0 ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
                          </Badge>
                          
                          <Button
                            size="sm"
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={product.current_stock === 0}
                            className="h-8 w-8 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full shadow-lg"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Category Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  Rekomendasi Untukmu
                </h2>
                <p className="text-gray-600">Produk lain yang mungkin Anda suka</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {recommendations.map((product) => (
                  <Card 
                    key={product.id} 
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm border-0 shadow-md hover:scale-105 rounded-xl overflow-hidden"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="absolute top-2 right-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        </div>
                      </div>
                      
                      <div className="p-3 space-y-2">
                        <h3 className="font-medium text-sm line-clamp-2 text-gray-800 min-h-[2rem]">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-green-600">
                            {formatPrice(product.selling_price)}
                          </p>
                          
                          <Button
                            size="sm"
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={product.current_stock === 0}
                            className="h-6 w-6 p-0 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-full"
                          >
                            <ShoppingCart className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <EnhancedFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default SearchResults;
