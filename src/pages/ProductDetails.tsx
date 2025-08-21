
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  LogIn, 
  UserCircle, 
  Menu, 
  X, 
  Store, 
  ArrowLeft, 
  Minus, 
  Plus,
  Heart,
  Settings
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import AuthModal from '@/components/AuthModal';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import ProductReviews from '@/components/ProductReviews';
import ProductRecommendations from '@/components/ProductRecommendations';
import FrontendFooter from '@/components/frontend/FrontendFooter';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { addToCart, getTotalItems } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const storeInfo = settings?.store_info || {};
  const contactInfo = settings?.contact_info || {};
  const logoUrl = storeInfo.logo_url;
  const storeName = 'TokoQu';

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const handleAddToCart = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!product) return;

    if (product.current_stock < quantity) {
      toast({
        title: 'Stok Tidak Cukup',
        description: `Stok tersedia: ${product.current_stock}`,
        variant: 'destructive',
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: quantity,
      stock: product.current_stock,
      image_url: product.image_url
    });

    toast({
      title: 'Berhasil',
      description: `${product.name} ditambahkan ke keranjang`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produk Tidak Ditemukan</h1>
          <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
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
                          <Settings className="h-4 w-4 mr-2" />
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
                      <Settings className="h-4 w-4 mr-2" />
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
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div>
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              {product.categories && (
                <Badge variant="secondary" className="mb-4">
                  {product.categories.name}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-3xl font-bold text-blue-600">
                {formatPrice(product.selling_price)}
              </p>
              <p className="text-gray-600">
                Stok tersedia: <span className="font-medium">{product.current_stock}</span>
              </p>
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Deskripsi</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah
                </label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                    min="1"
                    max={product.current_stock}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                    disabled={quantity >= product.current_stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={product.current_stock === 0}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.current_stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </Button>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />

        {/* Product Recommendations */}
        <ProductRecommendations 
          currentProductId={product.id} 
          categoryId={product.category_id} 
        />
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
