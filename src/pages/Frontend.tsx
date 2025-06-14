
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Star, 
  Package, 
  Phone, 
  Mail, 
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Zap,
  LogOut
} from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import CartModal from '@/components/CartModal';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

const Frontend = () => {
  const { user, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

  // Fetch store settings
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;
      
      const settings: Record<string, any> = {};
      data?.forEach(setting => {
        settings[setting.key] = setting.value;
      });
      return settings;
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
    queryKey: ['frontend-products', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .eq('is_active', true);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      const { data, error } = await query.order('name').limit(20);
      if (error) throw error;
      return data;
    }
  });

  // Fetch flash sales
  const { data: flashSales = [] } = useQuery({
    queryKey: ['active-flash-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items(
            *,
            products(
              id,
              name,
              image_url,
              selling_price
            )
          )
        `)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Get best selling products (mock data for now)
  const bestSellingProducts = products.slice(0, 6);

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        id: product.id,
        name: product.name,
        price: product.selling_price,
        quantity: 1,
        image_url: product.image_url
      }];
    });
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  const getTotalCartItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const storeName = storeSettings?.store_name?.name || 'SmartPOS';
  const bannerImage = storeSettings?.banner_image?.url || '';
  const bannerTitle = storeSettings?.banner_title?.text || 'Belanja Mudah & Hemat';
  const bannerSubtitle = storeSettings?.banner_subtitle?.text || 'Temukan berbagai produk berkualitas dengan harga terbaik di SmartPOS';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                {storeName}
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Auth & Cart */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Hello, {user.email}</span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setShowAuthModal(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
              
              <Button variant="outline" size="sm" onClick={() => setShowCartModal(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {getTotalCartItems() > 0 && (
                  <Badge className="ml-2 bg-red-500">
                    {getTotalCartItems()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="pt-16">
        {/* Hero Section */}
        <section 
          className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20"
          style={bannerImage ? {
            backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8)), url(${bannerImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {bannerTitle}
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              {bannerSubtitle}
            </p>
            <Button size="lg" variant="secondary">
              Mulai Belanja
            </Button>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Kategori Produk</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <Card 
                className={`cursor-pointer hover:shadow-lg transition-shadow ${!selectedCategory ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                <CardContent className="p-6 text-center">
                  <Package className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <p className="font-medium">Semua</p>
                </CardContent>
              </Card>
              {categories.map((category) => (
                <Card 
                  key={category.id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${selectedCategory === category.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-6 text-center">
                    <Package className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                    <p className="font-medium">{category.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Flash Sales */}
        {flashSales.length > 0 && (
          <section className="py-16 bg-red-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-center mb-12">
                <Zap className="h-8 w-8 text-red-600 mr-3" />
                <h2 className="text-3xl font-bold text-red-600">Flash Sale</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {flashSales[0]?.flash_sale_items?.slice(0, 4).map((item: any) => {
                  // Add null check for item.products
                  if (!item.products) {
                    console.log('Skipping flash sale item with null products:', item);
                    return null;
                  }
                  
                  return (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <img 
                          src={getImageUrl(item.products.image_url)} 
                          alt={item.products.name}
                          className="w-full h-48 object-cover rounded mb-4"
                        />
                        <h3 className="font-semibold mb-2">{item.products.name}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg font-bold text-red-600">
                            Rp {item.sale_price.toLocaleString('id-ID')}
                          </span>
                          <span className="text-sm line-through text-gray-500">
                            Rp {item.original_price.toLocaleString('id-ID')}
                          </span>
                          <Badge variant="destructive">
                            -{item.discount_percentage}%
                          </Badge>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => addToCart({
                            ...item.products,
                            selling_price: item.sale_price
                          })}
                        >
                          Tambah ke Cart
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          </section>
        )}

        {/* Best Selling Products */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center mb-12">
              <Star className="h-8 w-8 text-yellow-500 mr-3" />
              <h2 className="text-3xl font-bold">Produk Terlaris</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bestSellingProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <img 
                      src={getImageUrl(product.image_url)} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded mb-4"
                    />
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-green-600">
                        Rp {product.selling_price.toLocaleString('id-ID')}
                      </span>
                      <Badge variant="secondary">
                        {product.categories?.name}
                      </Badge>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => addToCart(product)}
                    >
                      Tambah ke Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* All Products */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Semua Produk</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <img 
                      src={getImageUrl(product.image_url)} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded mb-4"
                    />
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-green-600">
                        Rp {product.selling_price.toLocaleString('id-ID')}
                      </span>
                      <Badge variant="secondary">
                        {product.categories?.name}
                      </Badge>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => addToCart(product)}
                    >
                      Tambah ke Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{storeName}</h3>
                <p className="text-gray-400 mb-4">
                  Platform belanja online terpercaya dengan produk berkualitas dan harga terbaik.
                </p>
                <div className="flex space-x-4">
                  <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                  <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                  <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Tentang Kami</a></li>
                  <li><a href="#" className="hover:text-white">Kebijakan Privasi</a></li>
                  <li><a href="#" className="hover:text-white">Syarat & Ketentuan</a></li>
                  <li><a href="#" className="hover:text-white">FAQ</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Kategori</h4>
                <ul className="space-y-2 text-gray-400">
                  {categories.slice(0, 4).map((category) => (
                    <li key={category.id}>
                      <a href="#" className="hover:text-white">{category.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Kontak</h4>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {storeSettings?.store_phone?.phone || '+62 123 456 7890'}
                  </li>
                  <li className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {storeSettings?.store_email?.email || 'info@smartpos.com'}
                  </li>
                  <li className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {storeSettings?.store_address?.address || 'Jakarta, Indonesia'}
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 {storeName}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <CartModal 
        open={showCartModal} 
        onOpenChange={setShowCartModal}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default Frontend;
