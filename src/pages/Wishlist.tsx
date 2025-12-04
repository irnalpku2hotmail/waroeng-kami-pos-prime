import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useProductLikes } from '@/hooks/useProductLikes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ShoppingCart, 
  Package, 
  ArrowLeft, 
  Store,
  Search,
  User,
  LogOut,
  LogIn,
  UserCircle,
  Menu,
  X
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/hooks/useSettings';
import AuthModal from '@/components/AuthModal';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import WishlistButton from '@/components/wishlist/WishlistButton';
import FrontendFooter from '@/components/frontend/FrontendFooter';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import { toast } from '@/hooks/use-toast';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { addItem, getTotalItems } = useCart();
  const { likedProducts } = useProductLikes();
  const { data: settings } = useSettings();
  const isMobile = useIsMobile();

  const [searchTerm, setSearchTerm] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const storeName = typeof settings?.store_name === 'string' ? settings.store_name : 'LAPAU.ID';
  const logoUrl = typeof settings?.store_info?.logo_url === 'string' ? settings.store_info.logo_url : null;
  const contactInfo = settings?.contact_info && typeof settings.contact_info === 'object' ? settings.contact_info : {};

  // Fetch wishlist products
  const { data: wishlistProducts = [], isLoading } = useQuery({
    queryKey: ['wishlist-products', Array.from(likedProducts)],
    queryFn: async () => {
      if (likedProducts.size === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', Array.from(likedProducts))
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching wishlist products:', error);
        return [];
      }

      return data || [];
    },
    enabled: likedProducts.size > 0
  });

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const handleAddToCart = (product: any) => {
    if (product.current_stock <= 0) {
      toast({
        title: 'Stok Habis',
        description: 'Produk ini sedang tidak tersedia',
        variant: 'destructive',
      });
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      stock: product.current_stock,
      image: product.image_url,
    });

    toast({
      title: 'Berhasil!',
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">Login untuk melihat Wishlist</h2>
          <p className="text-gray-600 mb-4">Silakan login untuk melihat produk favorit Anda</p>
          <Button onClick={() => setAuthModalOpen(true)}>
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </Button>
        </Card>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
      {/* Navbar */}
      <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
        {!isMobile && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-4">
                {typeof contactInfo.phone === 'string' && contactInfo.phone && <span>📞 {contactInfo.phone}</span>}
                {typeof contactInfo.email === 'string' && contactInfo.email && <span className="hidden md:inline">✉️ {contactInfo.email}</span>}
              </div>
              <span>Selamat Datang di {storeName}!</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full object-cover ring-2 ring-blue-500`} />
              ) : (
                <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-blue-600 flex items-center justify-center`}>
                  <Store className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                </div>
              )}
              <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                {storeName}
              </h1>
            </div>

            {/* Search Bar - Desktop */}
            {!isMobile && (
              <div className="flex-1 max-w-2xl mx-8">
                <div className="flex gap-2">
                  <Input
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <NotificationDropdown />
              
              <Button variant="ghost" size="sm" className="relative p-2 hover:bg-blue-50" onClick={() => setShowCartModal(true)}>
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-red-500">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>

              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-blue-50 px-3 py-2 rounded-xl">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="h-6 w-6 rounded-full object-cover" />
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
                    <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                      <Heart className="h-4 w-4 mr-2" />
                      Wishlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {isMobile && (
                <Button variant="ghost" size="sm" className="p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isMobile && (
          <div className="bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <Button variant="outline" size="sm" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }} className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={() => { navigate('/wishlist'); setMobileMenuOpen(false); }} className="w-full justify-start">
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Wishlist Saya</h1>
          <Badge variant="secondary">{wishlistProducts.length} Produk</Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="bg-gray-200 h-32 rounded-lg mb-3" />
                  <div className="bg-gray-200 h-4 rounded mb-2" />
                  <div className="bg-gray-200 h-4 w-2/3 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold mb-2">Wishlist Kosong</h2>
            <p className="text-gray-600 mb-4">Anda belum menambahkan produk ke wishlist</p>
            <Button onClick={() => navigate('/')}>
              Mulai Belanja
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlistProducts.map((product) => (
              <Card 
                key={product.id}
                className="group cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <CardContent className="p-3">
                  <div className="relative w-full h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2">
                      <WishlistButton productId={product.id} size="sm" />
                    </div>

                    <Badge 
                      variant={product.current_stock > 0 ? "secondary" : "destructive"}
                      className="absolute top-2 left-2 text-xs"
                    >
                      {product.current_stock > 0 ? `${product.current_stock}` : 'Habis'}
                    </Badge>
                  </div>

                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>

                  <div className="text-blue-600 font-bold text-sm mb-3">
                    {formatPrice(product.selling_price)}
                  </div>

                  <Button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                    disabled={product.current_stock <= 0}
                    className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {product.current_stock > 0 ? 'Tambah' : 'Habis'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FrontendFooter />
      <EnhancedFrontendCartModal open={showCartModal} onOpenChange={setShowCartModal} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav 
          onCartClick={() => setShowCartModal(true)}
          onAuthClick={() => setAuthModalOpen(true)}
        />
      )}
    </div>
  );
};

export default Wishlist;
