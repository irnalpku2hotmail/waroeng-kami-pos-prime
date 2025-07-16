
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Package, Search } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CartModal from '@/components/CartModal';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  selling_price: number;
  image_url: string | null;
  description: string | null;
  current_stock: number;
  categories?: {
    id: string;
    name: string;
  };
}

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [cartModalOpen, setCartModalOpen] = useState(false);
  
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  // Fetch store settings for navbar
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

  // Search products query
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['search-products', query, categoryId],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('products')
        .select(`
          id,
          name,
          selling_price,
          image_url,
          description,
          current_stock,
          categories (
            id,
            name
          )
        `)
        .eq('is_active', true);

      if (categoryId) {
        // Search by category
        queryBuilder = queryBuilder.eq('category_id', categoryId);
      } else if (query) {
        // Search by product name or category name
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,categories.name.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder.limit(20);
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!(query || categoryId)
  });

  // Get category name if searching by category
  const { data: categoryData } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleCategorySelect = (newCategoryId: string) => {
    navigate(`/search?category=${newCategoryId}`);
  };

  const handleAddToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      toast({
        title: 'Stok Habis',
        description: 'Produk ini sedang tidak tersedia',
        variant: 'destructive'
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image_url: product.image_url
    });

    toast({
      title: 'Berhasil',
      description: `${product.name} ditambahkan ke keranjang`
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getSearchTitle = () => {
    if (categoryId && categoryData) {
      return `Hasil pencarian untuk kategori "${categoryData.name}"`;
    }
    if (query) {
      return `Hasil pencarian untuk "${query}"`;
    }
    return 'Hasil pencarian';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar
        storeInfo={settings}
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      {/* Categories Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategori</h2>
          <HomeCategoriesSlider onCategorySelect={handleCategorySelect} />
        </div>
      </div>

      {/* Search Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {getSearchTitle()}
          </h1>
          <p className="text-gray-600">
            {isLoading ? 'Mencari...' : `${products.length} produk ditemukan`}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && products.length === 0 && (query || categoryId) && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak ada produk ditemukan
            </h3>
            <p className="text-gray-600 mb-4">
              Coba gunakan kata kunci lain atau jelajahi kategori produk
            </p>
            <Button onClick={() => navigate('/')}>
              Kembali ke Beranda
            </Button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    <div 
                      className="aspect-square bg-gray-100 overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {product.current_stock <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge variant="destructive">Stok Habis</Badge>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 w-8 h-8 p-0 bg-white/80 hover:bg-white"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-3 space-y-2">
                    <div 
                      className="cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      
                      {product.categories && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {product.categories.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-blue-600 text-sm">
                          {formatPrice(product.selling_price)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Stok: {product.current_stock}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.current_stock <= 0}
                        className="w-8 h-8 p-0"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default SearchResults;
