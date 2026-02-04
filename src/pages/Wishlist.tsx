
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
import { Heart, ShoppingCart, Package, ArrowLeft, LogIn } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import AuthModal from '@/components/AuthModal';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import WishlistButton from '@/components/wishlist/WishlistButton';
import { toast } from '@/hooks/use-toast';
import WhatsAppFloatingButton from '@/components/frontend/WhatsAppFloatingButton';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { likedProducts } = useProductLikes();
  const isMobile = useIsMobile();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

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
      {/* Reusable Navbar */}
      <FrontendNavbar
        onCartClick={() => setShowCartModal(true)}
      />

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

      <MinimalFooter />
      <EnhancedFrontendCartModal open={showCartModal} onOpenChange={setShowCartModal} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav 
          onCartClick={() => setShowCartModal(true)}
          onAuthClick={() => setAuthModalOpen(true)}
        />
      )}

      {/* WhatsApp Floating Button */}
      <WhatsAppFloatingButton className={isMobile ? 'bottom-24' : ''} />
    </div>
  );
};

export default Wishlist;
