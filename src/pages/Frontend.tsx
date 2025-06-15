
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Package, Star, Search, Menu, User, Heart, MapPin, Phone, Mail } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);

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
      return data.value as unknown as FrontendSettings;
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
    queryKey: ['frontend-products', selectedCategory, searchTerm],
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

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name').limit(20);
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
  const featuredCategories = categories.slice(0, categoriesLimit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-blue-600 text-white py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              0800-1-BLIBLI
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              help@smartpos.com
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Gratis ongkir se-Indonesia</span>
            <span>•</span>
            <span>Download App</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">SmartPOS</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Cari produk, kategori, brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden md:inline">Jakarta</span>
              </Button>
              
              <Button variant="ghost" size="sm">
                <Heart className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={() => setShowCart(!showCart)}
              >
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-8 py-3">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              Kategori
            </Button>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Flash Sale</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Official Store</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Tiket & Hiburan</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Pulsa & Data</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Travel</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      {frontendSettings?.banner_url && (
        <div className="relative h-80 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
          <img 
            src={frontendSettings.banner_url} 
            alt="Store Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center">
            <div className="container mx-auto px-4">
              <div className="text-white max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  {frontendSettings?.welcome_message || 'Selamat datang di toko kami'}
                </h2>
                <p className="text-xl mb-6">Produk berkualitas dengan harga terjangkau</p>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Belanja Sekarang
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Categories Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Kategori Pilihan</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className="h-24 flex-col p-4 bg-white border-2 hover:border-blue-500 transition-all"
                >
                  <Package className="h-8 w-8 mb-2 text-blue-600" />
                  <span className="text-sm font-medium">Semua</span>
                </Button>
                {featuredCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="h-24 flex-col p-4 bg-white border-2 hover:border-blue-500 transition-all"
                  >
                    {category.icon_url ? (
                      <img src={category.icon_url} alt={category.name} className="h-8 w-8 mb-2 object-contain" />
                    ) : (
                      <Package className="h-8 w-8 mb-2 text-blue-600" />
                    )}
                    <span className="text-sm font-medium text-center">{category.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Products Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedCategory ? 
                    `Produk ${categories.find(c => c.id === selectedCategory)?.name}` : 
                    'Semua Produk'
                  }
                </h2>
                <span className="text-gray-600">{products.length} produk ditemukan</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                  const productImageUrl = getImageUrl(product.image_url);
                  return (
                    <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <div className="aspect-square bg-gray-100 relative">
                          {productImageUrl ? (
                            <img 
                              src={productImageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                          <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                            Stok: {product.current_stock}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="absolute top-2 left-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-lg font-bold text-blue-600">
                              Rp {product.selling_price?.toLocaleString('id-ID')}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-500">{product.loyalty_points || 1} pts</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAddToCart(product)}
                          className="w-full text-sm py-2"
                          disabled={product.current_stock <= 0}
                        >
                          + Keranjang
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {products.length === 0 && (
                <div className="text-center py-16">
                  <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada produk</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 
                      `Tidak ditemukan produk dengan kata kunci "${searchTerm}"` :
                      'Belum ada produk dalam kategori ini'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {showCart && <FrontendCart />}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SmartPOS</h3>
              <p className="text-gray-300 text-sm">
                Platform e-commerce terpercaya dengan produk berkualitas dan harga terjangkau.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">Cara Berbelanja</a></li>
                <li><a href="#" className="hover:text-white">Pembayaran</a></li>
                <li><a href="#" className="hover:text-white">Pengiriman</a></li>
                <li><a href="#" className="hover:text-white">Retur & Refund</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tentang SmartPOS</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white">Karir</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Press Release</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hubungi Kami</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  0800-1-SMARTPOS
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  help@smartpos.com
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 SmartPOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Frontend;
