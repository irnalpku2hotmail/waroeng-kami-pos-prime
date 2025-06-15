
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProductLikes } from '@/hooks/useProductLikes';
import { 
  ArrowLeft, 
  Package, 
  Star, 
  Heart, 
  ShoppingCart, 
  Truck,
  Plus,
  Minus
} from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isLiked, toggleLike } = useProductLikes();
  const [quantity, setQuantity] = useState(1);

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product-details', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation),
          suppliers(name),
          price_variants(
            id,
            name,
            price,
            minimum_quantity,
            is_active
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  const getBestPrice = (quantity: number = 1) => {
    if (!product?.price_variants || product.price_variants.length === 0) {
      return {
        price: product?.selling_price || 0,
        isWholesale: false,
        variantName: null,
        minQuantity: 1
      };
    }

    const activeVariants = product.price_variants
      .filter((variant: any) => variant.is_active)
      .sort((a: any, b: any) => b.minimum_quantity - a.minimum_quantity);

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
      price: product?.selling_price || 0,
      isWholesale: false,
      variantName: null,
      minQuantity: 1
    };
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const priceInfo = getBestPrice(quantity);
    
    const cartItem = {
      id: Date.now().toString(),
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      quantity: quantity,
      unit_price: priceInfo.price,
      total_price: priceInfo.price * quantity,
      current_stock: product.current_stock,
      loyalty_points: product.loyalty_points || 1,
      original_price: product.selling_price,
      is_wholesale: priceInfo.isWholesale,
      wholesale_min_qty: priceInfo.minQuantity
    };
    
    addItem(cartItem);
  };

  const adjustQuantity = (adjustment: number) => {
    const newQuantity = quantity + adjustment;
    if (newQuantity >= 1 && newQuantity <= (product?.current_stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-pulse" />
          <p className="text-gray-500">Memuat detail produk...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Produk tidak ditemukan</h2>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  const productImageUrl = getImageUrl(product.image_url);
  const productIsLiked = isLiked(product.id);
  const priceInfo = getBestPrice(quantity);
  const hasWholesalePrice = product.price_variants && product.price_variants.some((v: any) => v.is_active);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Kembali
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {productImageUrl ? (
                  <img 
                    src={productImageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => toggleLike(product.id)}
                  className={`absolute top-4 right-4 h-10 w-10 p-0 transition-colors ${
                    productIsLiked 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-white/80 hover:bg-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${productIsLiked ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </Card>
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
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">{product.loyalty_points || 1} poin</span>
                </div>
                <Badge className={product.current_stock > 0 ? 'bg-green-500' : 'bg-red-500'}>
                  Stok: {product.current_stock}
                </Badge>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                Rp {(priceInfo.price * quantity).toLocaleString('id-ID')}
              </div>
              {priceInfo.isWholesale && (
                <div className="text-sm text-orange-600 font-medium">
                  {priceInfo.variantName} (min. {priceInfo.minQuantity} pcs)
                </div>
              )}
              {hasWholesalePrice && !priceInfo.isWholesale && (
                <div className="text-sm text-gray-500">
                  Harga grosir tersedia
                </div>
              )}
              <div className="text-sm text-gray-500">
                Harga satuan: Rp {priceInfo.price.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Wholesale Prices */}
            {hasWholesalePrice && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Harga Grosir</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Harga Eceran:</span>
                      <span>Rp {product.selling_price.toLocaleString('id-ID')}</span>
                    </div>
                    {product.price_variants
                      ?.filter((v: any) => v.is_active)
                      .map((variant: any) => (
                        <div key={variant.id} className="flex justify-between text-sm">
                          <span>{variant.name} (min. {variant.minimum_quantity}):</span>
                          <span className="font-medium text-orange-600">
                            Rp {variant.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah
                </label>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => adjustQuantity(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-semibold px-4">{quantity}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => adjustQuantity(1)}
                    disabled={quantity >= product.current_stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Stok tersedia: {product.current_stock} {product.units?.name || 'pcs'}
                </p>
              </div>

              {/* Add to Cart */}
              <Button 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleAddToCart}
                disabled={product.current_stock <= 0 || quantity > product.current_stock}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Tambah ke Keranjang
              </Button>

              {/* COD Info */}
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <Truck className="h-4 w-4" />
                <span>Tersedia Cash on Delivery (COD)</span>
              </div>
            </div>

            {/* Product Details */}
            {product.description && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Deskripsi Produk</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Additional Info */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Informasi Produk</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {product.units && (
                    <div>
                      <span className="text-gray-500">Unit:</span>
                      <div className="font-medium">{product.units.name}</div>
                    </div>
                  )}
                  {product.suppliers && (
                    <div>
                      <span className="text-gray-500">Supplier:</span>
                      <div className="font-medium">{product.suppliers.name}</div>
                    </div>
                  )}
                  {product.barcode && (
                    <div>
                      <span className="text-gray-500">Barcode:</span>
                      <div className="font-medium">{product.barcode}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Min. Stok:</span>
                    <div className="font-medium">{product.min_stock}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
