import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, LogOut, LogIn, UserCircle, Menu, X, Store, Search, ArrowLeft, Heart, Share2, Plus, Minus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import AuthModal from '@/components/AuthModal';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import ProductRecommendations from '@/components/ProductRecommendations';
import ProductSimilarCarousel from '@/components/ProductSimilarCarousel';
import FrontendFooter from '@/components/frontend/FrontendFooter';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { addToCart, getTotalItems } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          units(name, abbreviation)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  });

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

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const storeInfo = settings?.store_info || {};
  const contactInfo = settings?.contact_info || {};
  const logoUrl = storeInfo.logo_url;
  const storeName = 'TokoQu';

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const incrementQuantity = () => {
    if (product && quantity < product.current_stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!product) return;

    if (quantity > product.current_stock) {
      toast({
        title: 'Stok tidak mencukupi',
        description: `Stok tersedia: ${product.current_stock}`,
        variant: 'destructive',
      });
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: quantity,
      image: product.image_url,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: product.selling_price,
      total_price: product.selling_price * quantity
    };

    addToCart(cartItem);
    toast({
      title: 'Berhasil ditambahkan',
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-64 w-full rounded-md mb-4"></div>
            <div className="bg-gray-200 h-8 w-3/4 mb-2"></div>
            <div className="bg-gray-200 h-6 w-1/2 mb-4"></div>
            <div className="bg-gray-200 h-4 w-1/4 mb-6"></div>
            <div className="bg-gray-200 h-12 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Produk tidak ditemukan
          </h2>
          <p className="text-gray-500">
            Maaf, produk dengan ID ini tidak tersedia.
          </p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - Same as Home */}
      <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
        {!isMobile && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-4">
                {contactInfo.phone && (
                  <span>📞 {contactInfo.phone}</span>
                )}
                {contactInfo.email && (
                  <span className="hidden md:inline">✉️ {contactInfo.email}</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span>Selamat Datang di {storeName}!</span>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Store Name */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              {logoUrl && (
                <div className="relative">
                  <img 
                    src={logoUrl} 
                    alt={storeName} 
                    className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full object-cover ring-2 ring-blue-500`} 
                  />
                </div>
              )}
              {!logoUrl && (
                <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-blue-600 flex items-center justify-center`}>
                  <Store className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                </div>
              )}
              <div>
                <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                  {isMobile ? storeName.slice(0, 15) + (storeName.length > 15 ? '...' : '') : storeName}
                </h1>
                {!isMobile && (
                  <p className="text-xs text-gray-500">
                    {storeInfo.tagline || 'Toko Online Terpercaya'}
                  </p>
                )}
              </div>
            </div>

            {/* Search Bar - Desktop */}
            {!isMobile && (
              <div className="flex-1 max-w-2xl mx-8">
                <div className="flex gap-2">
                  <Input
                    placeholder="Cari produk..."
                    onKeyPress={(e) => e.key === 'Enter' && navigate(`/search?q=${e.target.value}`)}
                    className="flex-1"
                  />
                  <Button onClick={() => navigate(`/search?q=${''}`)}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative hover:bg-blue-50 p-2"
                  onClick={() => setShowCartModal(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
                      {getTotalItems()}
                    </Badge>
                  )}
                </Button>
              )}

              {!isMobile && (
                <div>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-blue-50 px-3 py-2 rounded-xl">
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt="Profile" 
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle className="h-6 w-6" />
                          )}
                          <span className="hidden lg:inline text-sm font-medium">
                            {profile?.full_name || user.email?.split('@')[0]}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAuthModalOpen(true)}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 px-4"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Masuk
                    </Button>
                  )}
                </div>
              )}

              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          {isMobile && (
            <div className="pb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Cari produk..."
                  onKeyPress={(e) => e.key === 'Enter' && navigate(`/search?q=${e.target.value}`)}
                  className="flex-1"
                />
                <Button onClick={() => navigate(`/search?q=${''}`)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isMobile && (
          <div className="bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-4">
              {contactInfo.phone && (
                <div className="text-sm text-gray-600 pb-2 border-b">
                  📞 {contactInfo.phone}
                </div>
              )}
              
              <div className="border-t pt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 py-2">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-8 w-8 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate('/profile');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start mb-2"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Masuk
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div>
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-96 object-cover rounded-md"
            />
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <div className="flex items-center space-x-2 mb-3">
              {product.categories && (
                <Badge variant="secondary">
                  {product.categories.name}
                </Badge>
              )}
              <Badge>
                Stok: {product.current_stock} {product.units?.abbreviation}
              </Badge>
            </div>
            <p className="text-gray-600 mb-4">{product.description}</p>
            <p className="text-2xl font-bold text-blue-600 mb-4">
              {formatPrice(product.selling_price)}
            </p>

            {/* Quantity */}
            <div className="flex items-center space-x-3 mb-6">
              <Button
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0 && value <= (product?.current_stock || 0)) {
                    setQuantity(value);
                  }
                }}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
                disabled={quantity >= product.current_stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Add to Cart */}
            <Button
              className="w-full"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Tambah ke Keranjang
            </Button>
          </div>
        </div>

        {/* Product Recommendations */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Rekomendasi Produk
          </h2>
          <ProductRecommendations categoryId={product.category_id} excludeProductId={product.id} limit={5} />
        </div>

        {/* Similar Products Carousel */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Produk Serupa
          </h2>
          <ProductSimilarCarousel categoryId={product.category_id} excludeProductId={product.id} limit={10} />
        </div>
      </div>

      {/* Footer */}
      <FrontendFooter />

      {/* Modals */}
      {user && (
        <EnhancedFrontendCartModal 
          open={showCartModal} 
          onOpenChange={setShowCartModal} 
        />
      )}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};

export default ProductDetails;
