import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, Star, Eye, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import FrontendCart from '@/components/FrontendCart';

interface FrontendSettings {
  banner_url: string;
  welcome_message: string;
  featured_categories_limit: number;
}

const Frontend = () => {
  const { addItem, items } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Fetch frontend settings
  const { data: frontendSettings } = useQuery({
    queryKey: ['frontend-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'frontend_settings')
        .single();
      if (error) {
        return {
          banner_url: '',
          welcome_message: 'Selamat datang di toko kami',
          featured_categories_limit: 5
        } as FrontendSettings;
      }
      return data.value as FrontendSettings;
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
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

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['frontend-products', selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .eq('is_active', true)
        .gt('current_stock', 0);
      
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      const { data, error } = await query.order('name').limit(12);
      if (error) throw error;
      return data;
    }
  });

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  const handleAddToCart = (product: any) => {
    const cartItem = {
      id: Date.now().toString(),
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      quantity: 1,
      unit_price: product.selling_price,
      total_price: product.selling_price,
      current_stock: product.current_stock,
      loyalty_points: product.loyalty_points || 1
    };
    
    addItem(cartItem);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const categoriesLimit = frontendSettings?.featured_categories_limit || 5;
  const displayedCategories = showAllCategories ? categories : categories.slice(0, categoriesLimit);
  const hasMoreCategories = categories.length > categoriesLimit;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-800">SmartPOS Store</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      {frontendSettings?.banner_url && (
        <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
          <img 
            src={frontendSettings.banner_url} 
            alt="Store Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-2">
                {frontendSettings?.welcome_message || 'Selamat datang di toko kami'}
              </h2>
              <p className="text-xl">Produk berkualitas dengan harga terjangkau</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Categories */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Kategori Produk</h2>
                {hasMoreCategories && !showAllCategories && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAllCategories(true)}
                    className="flex items-center gap-2"
                  >
                    Lihat Semua
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className="h-20 flex-col"
                >
                  <Package className="h-6 w-6 mb-2" />
                  Semua
                </Button>
                {displayedCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="h-20 flex-col"
                  >
                    {category.icon_url ? (
                      <img src={category.icon_url} alt={category.name} className="h-6 w-6 mb-2" />
                    ) : (
                      <Package className="h-6 w-6 mb-2" />
                    )}
                    {category.name}
                  </Button>
                ))}
              </div>
              {showAllCategories && hasMoreCategories && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAllCategories(false)}
                  >
                    Tampilkan Lebih Sedikit
                  </Button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const productImageUrl = getImageUrl(product.image_url);
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {productImageUrl ? (
                        <img 
                          src={productImageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-green-500">
                        Stok: {product.current_stock}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-blue-600">
                          Rp {product.selling_price?.toLocaleString('id-ID')}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm">{product.loyalty_points || 1} pts</span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleAddToCart(product)}
                        className="w-full"
                        disabled={product.current_stock <= 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Tambah ke Keranjang
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada produk</h3>
                <p className="text-gray-500">Belum ada produk dalam kategori ini</p>
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <FrontendCart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Frontend;
