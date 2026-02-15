
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, Heart, Info } from 'lucide-react';
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

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
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

  // Cart disabled in catalog mode

  const handleLike = async () => {
    if (!user?.id || !id) {
      toast({
        title: 'Info',
        description: 'Silakan login untuk menyimpan produk favorit',
        variant: 'default',
      });
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
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
      {/* Navbar - Reusing FrontendNavbar with EnhancedHomeSearch */}
      <FrontendNavbar 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
        searchComponent={
          <EnhancedHomeSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory} 
          />
        } 
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
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

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              {product.categories && (
                <Badge variant="secondary">
                  {product.categories.name}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`${isLiked ? 'text-red-500' : 'text-gray-400'}`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-3xl font-bold text-blue-600">
                  {formatPrice(currentPrice)}
                </span>
                {selectedVariant && (
                  <Badge variant="outline" className="text-xs">
                    Min. {selectedVariant.minimum_quantity} {product.units?.abbreviation || 'unit'}
                  </Badge>
                )}
              </div>
              
              {product.price_variants && product.price_variants.length > 0 && (
                <div className="text-sm text-gray-500">
                  <p className="mb-2">Harga berdasarkan jumlah pembelian:</p>
                  <div className="space-y-1">
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

            <div className="flex items-center gap-4 mb-6">
              <Badge 
                variant={product.current_stock > 0 ? 'default' : 'destructive'}
              >
                {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
              </Badge>
            </div>

            {/* Catalog Mode Notice */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Produk hanya untuk katalog, pemesanan belum tersedia.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Price History Chart */}
        <div className="mb-8">
          <PriceHistoryChart productId={product.id} currentPrice={currentPrice} />
        </div>

        {/* Product Details & Reviews Tabs */}
        <Tabs defaultValue="description" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="description">Deskripsi</TabsTrigger>
            <TabsTrigger value="reviews">Review & Rating</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                {product.description ? (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Belum ada deskripsi untuk produk ini.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4">
            <ProductReviews productId={product.id} />
          </TabsContent>
        </Tabs>

        {/* Similar Products */}
        {product.categories && (
          <ProductSimilarCarousel 
            categoryId={product.categories.id} 
            currentProductId={product.id}
          />
        )}
      </div>

      <MinimalFooter />
      
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav />
      )}

      {/* WhatsApp Floating Button */}
      <WhatsAppFloatingButton className={isMobile ? 'bottom-24' : ''} />
    </div>
  );
};

export default ProductDetail;
