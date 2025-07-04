import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Package, Star, Search, Menu, User, Heart, Phone, Mail, Zap, Plus, Truck, Mic } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProductLikes } from '@/hooks/useProductLikes';
import CartModal from '@/components/CartModal';
import AuthModal from '@/components/AuthModal';
import CountdownTimer from '@/components/CountdownTimer';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Link } from 'react-router-dom';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface FrontendSettings {
  banner_url: string;
  welcome_message: string;
  featured_categories_limit: number;
}

const Frontend = () => {
  const { addItem, items } = useCart();
  const { user, signOut } = useAuth();
  const { isLiked, toggleLike } = useProductLikes();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Voice search functionality
  const startVoiceSearch = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'id-ID';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setSearchTerm(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      }
    }
  };

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

  // Fetch store settings
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['store_name', 'store_address', 'store_phone', 'store_email']);
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
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

  // Fetch active flash sales
  const { data: flashSales = [] } = useQuery({
    queryKey: ['active-flash-sales'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items(
            *,
            products(name, image_url, selling_price)
          )
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);
      if (error) throw error;
      return data;
    }
  });

  // Fetch products with price variants
  const { data: products = [] } = useQuery({
    queryKey: ['frontend-products', selectedCategory, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation),
          price_variants(
            id,
            name,
            price,
            minimum_quantity,
            is_active
          )
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

  const getBestPrice = (product: any, quantity: number = 1) => {
    if (!product.price_variants || product.price_variants.length === 0) {
      return {
        price: product.selling_price,
        isWholesale: false,
        variantName: null,
        minQuantity: 1
      };
    }

    // Filter active variants and sort by minimum quantity descending
    const activeVariants = product.price_variants
      .filter((variant: any) => variant.is_active)
      .sort((a: any, b: any) => b.minimum_quantity - a.minimum_quantity);

    // Find the best variant for the given quantity
    for (const variant of activeVariants) {
      if (quantity >= variant.minimum_quantity) {
        return {
          price: variant.price,
          isWholesale: true,
          variantName: variant.name,
          minQuantity: variant.minimum_quantity
        };
      }
    }

    return {
      price: product.selling_price,
      isWholesale: false,
      variantName: null,
      minQuantity: 1
    };
  };

  const handleAddToCart = (product: any) => {
    const priceInfo = getBestPrice(product, 1);
    
    const cartItem = {
      id: Date.now().toString(),
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      quantity: 1,
      unit_price: priceInfo.price,
      total_price: priceInfo.price,
      current_stock: product.current_stock,
      loyalty_points: product.loyalty_points || 1,
      original_price: product.selling_price,
      is_wholesale: priceInfo.isWholesale,
      wholesale_min_qty: priceInfo.minQuantity
    };
    
    addItem(cartItem);
  };

  const handleAddFlashSaleToCart = (item: any) => {
    const cartItem = {
      id: Date.now().toString(),
      product_id: item.products.id,
      name: item.products.name,
      image_url: item.products.image_url,
      quantity: 1,
      unit_price: item.sale_price,
      total_price: item.sale_price,
      current_stock: item.stock_quantity,
      loyalty_points: 1
    };
    
    addItem(cartItem);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      setShowAuthModal(true);
    }
  };

  const categoriesLimit = frontendSettings?.featured_categories_limit || 5;
  const featuredCategories = categories.slice(0, categoriesLimit);
  const storeName = storeSettings?.store_name?.name || 'SmartPOS';
  const storePhone = storeSettings?.store_phone?.phone || '0800-1-SMARTPOS';
  const storeEmail = storeSettings?.store_email?.email || 'help@smartpos.com';
  const storeAddress = storeSettings?.store_address?.address || 'Jakarta';

  // Ambil banners dari pengaturan frontend
  const banners: string[] =
    Array.isArray((frontendSettings as any)?.banner_urls)
      ? (frontendSettings as any).banner_urls
      : frontendSettings?.banner_url
        ? [frontendSettings.banner_url]
        : [];

  // Autoplay logic for carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return; // Don't autoplay if only one banner

    // Bersihkan interval sebelumnya
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Interval next slide per 5 detik (5000ms)
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [banners.length]);

  // Update currentSlide saat user mengklik CarouselNext/Previous
  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };
  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-blue-600 text-white py-2 px-4">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {storePhone}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {storeEmail}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Gratis ongkir se-Pekanbaru</span>
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
              <Link to="/dashboard">
                <h1 className="text-2xl font-bold text-blue-600 hover:text-blue-800 transition-colors">{storeName}</h1>
              </Link>
            </div>

            {/* Search Bar with Voice Search */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Cari produk, kategori, brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-12 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startVoiceSearch}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${
                    isListening ? 'text-red-500' : 'text-gray-400 hover:text-blue-500'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleAuthAction}
                className="flex items-center gap-2"
              >
                <User className="h-5 w-5" />
                <span className="hidden md:inline">
                  {user ? 'Logout' : 'Login'}
                </span>
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
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="flex items-center gap-2">
                    <Menu className="h-4 w-4" />
                    Kategori
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-3 gap-4 p-6 w-96">
                      <Button
                        variant={selectedCategory === null ? "default" : "ghost"}
                        onClick={() => setSelectedCategory(null)}
                        className="flex items-center gap-2 justify-start"
                      >
                        Semua Kategori
                      </Button>
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "ghost"}
                          onClick={() => setSelectedCategory(category.id)}
                          className="flex items-center gap-2 justify-start"
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            {flashSales.length > 0 && (
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-red-600">
                <Zap className="h-4 w-4" />
                Flash Sale
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Banner/Slider */}
      {banners.length > 0 && (
        <div className="relative h-80 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden animate-fade-in">
          {banners.length === 1 ? (
            // Show single image if only one
            <img
              src={banners[0]}
              alt="Store Banner"
              className="w-full h-full object-cover transition-all duration-700"
            />
          ) : (
            // Custom carousel UI
            <div className="relative h-80 w-full select-none">
              {banners.map((url, idx) => (
                <img
                  key={url + idx}
                  src={url}
                  alt={`Banner ${idx + 1}`}
                  draggable="false"
                  style={{
                    opacity: idx === currentSlide ? 1 : 0,
                    zIndex: idx === currentSlide ? 2 : 1,
                    transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  className="rounded-none"
                />
              ))}
              {/* Prev/Next controls */}
              <Button
                size="icon"
                variant="secondary"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/70 hover:bg-white/90 shadow"
                aria-label="Sebelumnya"
              >
                <svg width="24" height="24" className="text-blue-600" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6" /></svg>
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/70 hover:bg-white/90 shadow"
                aria-label="Berikutnya"
              >
                <svg width="24" height="24" className="text-blue-600" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 6l6 6-6 6" /></svg>
              </Button>
              {/* Dot indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    className={`h-2 w-7 rounded-full transition-all duration-300 ${currentSlide === idx ? "bg-blue-600" : "bg-white/70"}`}
                    style={{ border: "none" }}
                    aria-label={`Pindah ke slide ${idx + 1}`}
                    onClick={() => setCurrentSlide(idx)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Flash Sales Section */}
        {flashSales.length > 0 && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-8 w-8" />
                  <h2 className="text-2xl font-bold">Flash Sale</h2>
                </div>
                <CountdownTimer 
                  endDate={flashSales[0]?.end_date} 
                  className="text-white"
                />
              </div>
            </div>
            <div className="bg-white p-6 rounded-b-lg shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {flashSales[0]?.flash_sale_items?.slice(0, 6).map((item: any) => (
                  <Card key={item.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                    <div className="relative">
                      <div className="aspect-square bg-gray-100">
                        {item.products?.image_url ? (
                          <Link to={`/products/${item.products.id}`}>
                            <img 
                              src={getImageUrl(item.products.image_url)} 
                              alt={item.products.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </Link>
                        ) : (
                          <Link to={`/products/${item.products.id}`}>
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          </Link>
                        )}
                        <Badge className="absolute top-2 right-2 bg-red-500">
                          -{item.discount_percentage}%
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddFlashSaleToCart(item)}
                          className="absolute top-2 right-2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm mb-2 line-clamp-2">
                        {item.products?.name}
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-red-600">
                            Rp {item.sale_price?.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 line-through">
                          Rp {item.original_price?.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(item.sold_quantity / item.stock_quantity) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Terjual {item.sold_quantity}/{item.stock_quantity}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => {
              const productImageUrl = getImageUrl(product.image_url);
              const productIsLiked = isLiked(product.id);
              const priceInfo = getBestPrice(product, 1);
              const hasWholesalePrice = product.price_variants && product.price_variants.some((v: any) => v.is_active);
              
              return (
                <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <div className="aspect-square bg-gray-100 relative">
                      {productImageUrl ? (
                        <Link to={`/products/${product.id}`}>
                          <img 
                            src={productImageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                      ) : (
                        <Link to={`/products/${product.id}`}>
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-16 w-16 text-gray-400" />
                          </div>
                        </Link>
                      )}
                      <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                        Stok: {product.current_stock}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => toggleLike(product.id)}
                        className={`absolute top-2 left-2 h-8 w-8 p-0 transition-colors ${
                          productIsLiked 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-white/80 hover:bg-white'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${productIsLiked ? 'fill-current' : ''}`} />
                      </Button>
                      {/* COD Badge */}
                      <Badge className="absolute bottom-2 left-2 bg-blue-500 text-white flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        COD
                      </Badge>
                      {/* Wholesale Badge */}
                      {hasWholesalePrice && (
                        <Badge className="absolute top-10 left-2 bg-orange-500 text-white text-xs">
                          Grosir
                        </Badge>
                      )}
                      {/* Cart Button - positioned in front of product image */}
                      <Button 
                        size="sm" 
                        onClick={() => handleAddToCart(product)}
                        className="absolute bottom-2 right-2 h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={product.current_stock <= 0}
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-blue-600">
                          Rp {priceInfo.price?.toLocaleString('id-ID')}
                        </span>
                        {priceInfo.isWholesale && (
                          <div className="text-xs text-orange-600 font-medium">
                            {priceInfo.variantName} (min. {priceInfo.minQuantity})
                          </div>
                        )}
                        {hasWholesalePrice && !priceInfo.isWholesale && (
                          <div className="text-xs text-gray-500">
                            Harga grosir tersedia
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">{product.loyalty_points || 1} pts</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2 text-xs text-green-600">
                      <Truck className="h-3 w-3" />
                      <span>Bayar di Tempat (COD)</span>
                    </div>
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{storeName}</h3>
              <p className="text-gray-300 text-sm">
                Platform e-commerce terpercaya dengan produk berkualitas dan harga terjangkau.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-300 flex items-center gap-2">
                  <span>{storeAddress}</span>
                </p>
              </div>
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
              <h4 className="font-semibold mb-4">Tentang {storeName}</h4>
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
                  {storePhone}
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {storeEmail}
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 {storeName}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Cart Modal */}
      <CartModal open={showCart} onOpenChange={setShowCart} />

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
      />
    </div>
  );
};

export default Frontend;
