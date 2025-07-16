
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Package, 
  Search, 
  Filter,
  MapPin,
  Phone,
  Mail,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch products based on search query
  const { data: products, isLoading } = useQuery({
    queryKey: ['search-products', searchQuery, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .eq('is_active', true)
        .order('name');

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image: product.image_url,
      stock: product.current_stock
    });

    toast({
      title: 'Berhasil!',
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStoreInfo = (key: string) => {
    const setting = settings?.[key];
    if (typeof setting === 'object' && setting !== null) {
      return Object.values(setting)[0] || '';
    }
    return setting || '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Results Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            {searchQuery ? `Hasil pencarian untuk "${searchQuery}"` : 'Semua Produk'}
          </h1>
          <p className="text-gray-600">
            Ditemukan {products?.length || 0} produk
          </p>
        </div>

        {/* Categories Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
            >
              Semua Kategori
            </Button>
            {categories?.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {products?.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div 
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-pointer"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.categories?.name || 'Tanpa Kategori'}
                    </Badge>
                    
                    <h3 
                      className="font-medium line-clamp-2 cursor-pointer hover:text-blue-600"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(product.selling_price)}
                      </span>
                      <Badge 
                        variant={product.current_stock > 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {product.current_stock > 0 ? 'Tersedia' : 'Habis'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      Stok: {product.current_stock} {product.units?.abbreviation}
                    </p>
                    
                    <Button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.current_stock === 0}
                      className="w-full"
                      size="sm"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {product.current_stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && products?.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada produk ditemukan
            </h3>
            <p className="text-gray-600">
              Coba ubah kata kunci pencarian atau filter yang digunakan
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Store Info */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-bold mb-4">
                {getStoreInfo('store_name') || 'SmartPOS'}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Alamat</p>
                    <p className="text-gray-300 text-sm">
                      {getStoreInfo('store_address') || 'Alamat toko belum diatur'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Telepon</p>
                    <p className="text-gray-300 text-sm">
                      {getStoreInfo('store_phone') || 'Nomor telepon belum diatur'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-300 text-sm">
                      {getStoreInfo('store_email') || 'Email belum diatur'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Tautan Cepat</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/home" className="text-gray-300 hover:text-white transition-colors">
                    Beranda
                  </a>
                </li>
                <li>
                  <a href="/products" className="text-gray-300 hover:text-white transition-colors">
                    Produk
                  </a>
                </li>
                <li>
                  <a href="/categories" className="text-gray-300 hover:text-white transition-colors">
                    Kategori
                  </a>
                </li>
                <li>
                  <a href="/orders" className="text-gray-300 hover:text-white transition-colors">
                    Pesanan
                  </a>
                </li>
              </ul>
            </div>

            {/* Operating Hours */}
            <div>
              <h3 className="text-lg font-bold mb-4">Jam Operasional</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Senin - Jumat</p>
                    <p className="text-gray-300 text-sm">08:00 - 17:00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="font-medium">Sabtu - Minggu</p>
                    <p className="text-gray-300 text-sm">09:00 - 16:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2024 {getStoreInfo('store_name') || 'SmartPOS'}. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SearchResults;
