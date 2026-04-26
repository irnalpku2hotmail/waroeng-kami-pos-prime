
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ShoppingCart, Package, Minus, Plus, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import ProductSimilarCarousel from '@/components/ProductSimilarCarousel';
import ProductReviews from '@/components/ProductReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import AuthModal from '@/components/AuthModal';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import WishlistButton from '@/components/wishlist/WishlistButton';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import PriceHistoryChart from '@/components/product/PriceHistoryChart';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import EnhancedHomeSearch from '@/components/home/EnhancedHomeSearch';
import WhatsAppFloatingButton from '@/components/frontend/WhatsAppFloatingButton';
import BundleCarousel from '@/components/bundles/BundleCarousel';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, getTotalItems } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation),
          price_variants (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Check if product is liked
  const { data: likeData } = useQuery({
    queryKey: ['product-like', id, user?.id],
    queryFn: async () => {
      if (!user?.id || !id) return null;
      
      const { data, error } = await supabase
        .from('user_product_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!id
  });

  useEffect(() => {
    if (likeData) {
      setIsLiked(true);
    }
  }, [likeData]);

  useEffect(() => {
    if (product) {
      // Set initial price
      const basePrice = product.selling_price;
      const variants = product.price_variants || [];
      
      if (variants.length > 0) {
        // Find the best variant for quantity 1
        const applicableVariant = variants
          .filter(v => v.is_active && quantity >= v.minimum_quantity)
          .sort((a, b) => b.minimum_quantity - a.minimum_quantity)[0];
        
        if (applicableVariant) {
          setSelectedVariant(applicableVariant);
          setCurrentPrice(applicableVariant.price);
        } else {
          setCurrentPrice(basePrice);
        }
      } else {
        setCurrentPrice(basePrice);
      }
    }
  }, [product, quantity]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      quantity: quantity,
      image: product.image_url,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: currentPrice,
      total_price: currentPrice * quantity,
      product: {
        id: product.id,
        name: product.name,
        image_url: product.image_url
      }
    });

    toast({
      title: 'Berhasil!',
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  const handleLike = async () => {
    if (!user?.id || !id) {
      setAuthModalOpen(true);
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('user_product_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        setIsLiked(false);
        toast({
          title: 'Berhasil',
          description: 'Produk dihapus dari favorit',
        });
      } else {
        await supabase
          .from('user_product_likes')
          .insert({
            user_id: user.id,
            product_id: id
          });
        setIsLiked(true);
        toast({
          title: 'Berhasil',
          description: 'Produk ditambahkan ke favorit',
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };
  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''} ${isMobile ? 'pt-12' : 'pt-[88px]'}`}>
      {/* Navbar - Reusing FrontendNavbar with EnhancedHomeSearch */}
      <FrontendNavbar 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
        onCartClick={() => setCartModalOpen(true)} 
        searchComponent={
          <EnhancedHomeSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory} 
          />
        } 
      />

      <div className="max-w-7xl mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-3 flex items-center gap-2 h-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 mb-4">
          {/* Product Image - smaller, sticky on desktop */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl border border-border/60 overflow-hidden lg:sticky lg:top-[100px]">
              <div className="aspect-square bg-gray-100 flex items-center justify-center max-w-sm mx-auto">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Product Details + Description + Reviews */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-border/60 p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              {product.categories && (
                <Badge variant="secondary" className="text-xs">
                  {product.categories.name}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`h-8 w-8 p-0 ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            {/* Price History inline (compact) */}
            <div className="mb-3">
              <PriceHistoryChart productId={product.id} currentPrice={currentPrice} />
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-2xl md:text-3xl font-bold text-blue-600">
                  {formatPrice(currentPrice)}
                </span>
                {selectedVariant && (
                  <Badge variant="outline" className="text-xs">
                    Min. {selectedVariant.minimum_quantity} {product.units?.abbreviation || 'unit'}
                  </Badge>
                )}
              </div>
              
              {product.price_variants && product.price_variants.length > 0 && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">
                  <p className="mb-1 font-medium text-gray-700">Harga berdasarkan jumlah pembelian:</p>
                  <div className="space-y-0.5">
                    {product.price_variants
                      .filter(v => v.is_active)
                      .sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                      .map(variant => (
                        <div key={variant.id} className="flex justify-between">
                          <span>{variant.minimum_quantity}+ {product.units?.abbreviation || 'unit'}</span>
                          <span className="font-medium">{formatPrice(variant.price)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-3">
              <Badge 
                variant={product.current_stock > 0 ? 'default' : 'destructive'}
                className="text-xs"
              >
                {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Jumlah
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-8 text-center"
                    min="1"
                    max={product.current_stock}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                    disabled={quantity >= product.current_stock}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-gray-500 ml-2">
                    {product.units?.abbreviation || 'unit'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.current_stock === 0}
                  className="flex-1 flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Tambah ke Keranjang
                </Button>
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  disabled={product.current_stock === 0}
                  className="px-4"
                >
                  Beli Sekarang
                </Button>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-500">
              <p>Total: <span className="font-bold text-gray-900">{formatPrice(currentPrice * quantity)}</span></p>
            </div>
          </div>
        </div>

        {/* Description & Reviews — 3-column grid on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
          {/* Description */}
          <div className="bg-white rounded-xl border border-border/60 p-3 md:p-4 lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-border/60">
              Deskripsi Produk
            </h2>
            {product.description ? (
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="text-gray-500 italic text-sm">Belum ada deskripsi untuk produk ini.</p>
            )}
          </div>

          {/* Reviews & Rating — spans 2 cols on desktop */}
          <div className="bg-white rounded-xl border border-border/60 p-3 md:p-4 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-border/60">
              Review & Rating
            </h2>
            <ProductReviews productId={product.id} />
          </div>
        </div>

        {/* Bundle Upsell */}
        <BundleCarousel title="🛒 Sering Dibeli Bersama" limit={6} />

        {/* Similar Products */}
        {product.categories && (
          <ProductSimilarCarousel 
            categoryId={product.categories.id} 
            currentProductId={product.id}
          />
        )}
      </div>

      <MinimalFooter />
      <EnhancedFrontendCartModal 
        open={cartModalOpen} 
        onOpenChange={(open) => {
          if (!user && open) {
            setAuthModalOpen(true);
            return;
          }
          setCartModalOpen(open);
        }} 
      />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav 
          onCartClick={() => setCartModalOpen(true)}
          onAuthClick={() => setAuthModalOpen(true)}
        />
      )}

      {/* WhatsApp Floating Button */}
      <WhatsAppFloatingButton className={isMobile ? 'bottom-24' : ''} />
    </div>
  );
};

export default ProductDetail;
