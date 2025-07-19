
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Heart, ShoppingCart, Minus, Plus, ArrowLeft, Star } from 'lucide-react';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import ProductRecommendations from '@/components/ProductRecommendations';
import { useProductLikes } from '@/hooks/useProductLikes';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          units (name, abbreviation),
          price_variants (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: flashSaleItem } = useQuery({
    queryKey: ['flash-sale-item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select(`
          *,
          flash_sales (*)
        `)
        .eq('product_id', id)
        .gt('stock_quantity', 0)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: storeInfo } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['store_name', 'store_address', 'store_phone', 'store_email']);

      if (error) throw error;

      const settings: Record<string, any> = {};
      data.forEach(setting => {
        settings[setting.key] = setting.value;
      });

      return {
        name: settings.store_name || 'Waroeng Kami',
        address: settings.store_address || 'Jl. Contoh No. 123, Jakarta',
        phone: settings.store_phone || '+62 812-3456-7890',
        email: settings.store_email || 'info@waroengkami.com'
      };
    },
  });

  const { toggleLike, isLiked } = useProductLikes();

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('User not authenticated');
      
      if (isLiked(id)) {
        const { error } = await supabase
          .from('user_product_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_product_likes')
          .insert({ user_id: user.id, product_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-likes', id] });
      toast({ 
        title: isLiked(id) ? 'Removed from favorites' : 'Added to favorites',
        description: isLiked(id) ? 'Product removed from your favorites' : 'Product added to your favorites'
      });
    },
  });

  useEffect(() => {
    if (product?.price_variants && product.price_variants.length > 0) {
      setSelectedVariant(product.price_variants[0]);
    }
  }, [product]);

  const getCurrentPrice = () => {
    if (flashSaleItem && isFlashSaleActive()) {
      return flashSaleItem.sale_price;
    }
    return selectedVariant?.price || product?.selling_price || 0;
  };

  const getOriginalPrice = () => {
    return selectedVariant?.price || product?.selling_price || 0;
  };

  const isFlashSaleActive = () => {
    if (!flashSaleItem?.flash_sales) return false;
    const now = new Date();
    const start = new Date(flashSaleItem.flash_sales.start_date);
    const end = new Date(flashSaleItem.flash_sales.end_date);
    return now >= start && now <= end && flashSaleItem.flash_sales.is_active;
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const price = getCurrentPrice();
    const variant = selectedVariant || {
      id: 'default',
      name: 'Regular',
      price: product.selling_price,
      minimum_quantity: 1
    };

    addItem({
      id: product.id,
      name: product.name,
      selling_price: price,
      image_url: product.image_url,
      current_stock: product.current_stock
    });

    toast({
      title: 'Added to cart',
      description: `${quantity}x ${product.name} added to cart`
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <HomeNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <HomeNavbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
        <HomeFooter storeInfo={storeInfo} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HomeNavbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-gray-700">
            Home
          </button>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg border overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              {product.categories && (
                <Badge variant="secondary" className="mb-4">
                  {product.categories.name}
                </Badge>
              )}
              
              {/* Flash Sale Banner */}
              {isFlashSaleActive() && (
                <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-red-600" />
                    <span className="text-red-800 font-medium">Flash Sale Active!</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    Limited time offer - {flashSaleItem?.stock_quantity} items left
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-green-600">
                    Rp {getCurrentPrice().toLocaleString('id-ID')}
                  </span>
                  {isFlashSaleActive() && (
                    <span className="text-lg text-gray-500 line-through">
                      Rp {getOriginalPrice().toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
                {isFlashSaleActive() && (
                  <div className="text-sm text-red-600 font-medium">
                    Save {Math.round(((getOriginalPrice() - getCurrentPrice()) / getOriginalPrice()) * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Price Variants */}
            {product.price_variants && product.price_variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Price Options</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.price_variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{variant.name}</div>
                      <div className="text-sm text-gray-500">
                        Min: {variant.minimum_quantity} pcs
                      </div>
                      <div className="text-green-600 font-medium">
                        Rp {variant.price.toLocaleString('id-ID')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Quantity</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
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
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-gray-500">
                  Stock: {product.current_stock}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  disabled={quantity > product.current_stock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleLike(id || '')}
                  className={isLiked(id || '') ? 'text-red-500 hover:text-red-600' : ''}
                >
                  <Heart className={`h-4 w-4 ${isLiked(id || '') ? 'fill-current' : ''}`} />
                </Button>
              </div>
              <Button
                onClick={handleBuyNow}
                className="w-full"
                variant="secondary"
                disabled={quantity > product.current_stock}
              >
                Buy Now
              </Button>
            </div>

            {/* Product Details */}
            <Separator />
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">SKU:</span>
                  <span>{product.barcode || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock:</span>
                  <span>{product.current_stock} {product.units?.abbreviation || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Minimum Order:</span>
                  <span>{product.min_quantity} {product.units?.abbreviation || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loyalty Points:</span>
                  <span>{product.loyalty_points} points</span>
                </div>
              </div>
              {product.description && (
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Recommendations */}
        <ProductRecommendations 
          currentProductId={id || ''} 
          categoryId={product.category_id}
          onProductClick={(productId) => navigate(`/product/${productId}`)}
        />
      </main>

      <HomeFooter storeInfo={storeInfo} />
    </div>
  );
};

export default ProductDetail;
