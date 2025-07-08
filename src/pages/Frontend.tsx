
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, Star, Package, Eye } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import FrontendHero from '@/components/frontend/FrontendHero';
import FrontendCategories from '@/components/frontend/FrontendCategories';
import FrontendFlashSale from '@/components/frontend/FrontendFlashSale';
import FrontendFooter from '@/components/frontend/FrontendFooter';

const Frontend = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);

  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  // Fetch products with filtering
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['frontend-products', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const handleAddToCart = (product: any) => {
    if (!user) {
      toast({
        title: 'Login Diperlukan',
        description: 'Silakan login terlebih dahulu untuk menambah produk ke keranjang.',
        variant: 'destructive'
      });
      return;
    }

    if (product.current_stock <= 0) {
      toast({
        title: 'Stok Habis',
        description: 'Produk ini sedang tidak tersedia.',
        variant: 'destructive'
      });
      return;
    }

    addItem(product);
    toast({
      title: 'Berhasil',
      description: `${product.name} ditambahkan ke keranjang.`
    });
  };

  const handleToggleLike = (productId: string) => {
    if (!user) {
      toast({
        title: 'Login Diperlukan',
        description: 'Silakan login untuk menyukai produk.',
        variant: 'destructive'
      });
      return;
    }

    setLikedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const storeInfo = settings?.store_info || {};
  const storeName = storeInfo.name || 'Toko Online';
  const storeDescription = storeInfo.description;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <FrontendNavbar
        storeName={storeName}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        likedProducts={likedProducts}
        onToggleLike={handleToggleLike}
      />

      {/* Hero Section */}
      <FrontendHero 
        storeName={storeName}
        storeDescription={storeDescription}
      />

      {/* Flash Sale Section */}
      <FrontendFlashSale onProductClick={handleProductClick} />

      {/* Categories */}
      <FrontendCategories
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Products Section */}
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedCategory ? 'Produk Kategori' : 'Semua Produk'}
            </h2>
            <p className="text-gray-600">
              {searchTerm && `Hasil pencarian "${searchTerm}"`}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm ? 'Tidak ada produk yang ditemukan' : 'Belum ada produk tersedia'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card 
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative">
                    <img
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {product.current_stock <= 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-sm">
                          Stok Habis
                        </Badge>
                      </div>
                    )}
                    {product.current_stock <= product.min_stock && product.current_stock > 0 && (
                      <Badge className="absolute top-2 left-2 bg-orange-500">
                        Stok Terbatas
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-blue-600">
                        Rp {product.selling_price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>Stok: {product.current_stock}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>4.5</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(product.id);
                        }}
                        className={likedProducts.includes(product.id) ? 'text-red-500' : ''}
                      >
                        <Heart className={`h-4 w-4 ${likedProducts.includes(product.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <FrontendFooter />

      {/* Product Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedProduct.image_url || '/placeholder.svg'}
                    alt={selectedProduct.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      Rp {selectedProduct.selling_price.toLocaleString('id-ID')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Kategori: {selectedProduct.categories?.name || 'Tidak ada kategori'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Stok: {selectedProduct.current_stock}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">4.5 (120 ulasan)</span>
                    </div>
                  </div>
                  
                  {selectedProduct.description && (
                    <div>
                      <h4 className="font-semibold mb-2">Deskripsi</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleToggleLike(selectedProduct.id)}
                      variant="outline"
                      className={`flex-1 ${likedProducts.includes(selectedProduct.id) ? 'text-red-500 border-red-500' : ''}`}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${likedProducts.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
                      {likedProducts.includes(selectedProduct.id) ? 'Disukai' : 'Suka'}
                    </Button>
                    <Button
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setDetailModalOpen(false);
                      }}
                      disabled={selectedProduct.current_stock <= 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {selectedProduct.current_stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Frontend;
