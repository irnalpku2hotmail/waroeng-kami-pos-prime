
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Plus, Minus, Heart, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-details', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          units (name, abbreviation),
          price_variants (
            id,
            name,
            price,
            minimum_quantity,
            is_active
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch related products from the same category
  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id, id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name),
          units (name, abbreviation)
        `)
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', id)
        .limit(4);

      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.category_id && !!id
  });

  const getBestPrice = (qty: number) => {
    if (!product?.price_variants || product.price_variants.length === 0) {
      return {
        price: product?.selling_price || 0,
        isWholesale: false,
        variantName: null
      };
    }

    const activeVariants = product.price_variants
      .filter(variant => variant.is_active)
      .sort((a, b) => b.minimum_quantity - a.minimum_quantity);

    for (const variant of activeVariants) {
      if (qty >= variant.minimum_quantity) {
        return {
          price: variant.price,
          isWholesale: true,
          variantName: variant.name
        };
      }
    }

    return {
      price: product.selling_price,
      isWholesale: false,
      variantName: null
    };
  };

  const handleAddToCart = () => {
    if (!product) return;

    const priceInfo = getBestPrice(quantity);
    
    addItem({
      id: product.id,
      name: product.name,
      price: priceInfo.price,
      image: product.image_url,
      quantity: quantity,
      stock: product.current_stock
    });

    toast({
      title: 'Berhasil!',
      description: `${product.name} (${quantity} pcs) telah ditambahkan ke keranjang`,
    });
  };

  const handleRelatedProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail produk...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Produk tidak ditemukan</h2>
          <p className="text-gray-500 mb-4">Produk yang Anda cari tidak tersedia</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const currentPrice = getBestPrice(quantity);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-friendly Header */}
      <div className="bg-white shadow-sm p-3 md:p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h1 className="font-semibold text-sm md:text-base">Detail Produk</h1>
          </div>
          <Button variant="ghost" size="sm" className="p-2">
            <Heart className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Product Image and Basic Info - Mobile Responsive */}
        <Card>
          <CardContent className="p-0">
            {/* Mobile: Smaller image, Desktop: Regular size */}
            <div className="aspect-square md:aspect-[4/3] lg:aspect-square bg-gray-100 overflow-hidden">
              <img 
                src={product.image_url || '/placeholder.svg'} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div>
                {product.categories && (
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {product.categories.name}
                  </Badge>
                )}
                <h1 className="text-lg md:text-xl font-bold leading-tight">{product.name}</h1>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xl md:text-2xl font-bold text-blue-600">
                    Rp {currentPrice.price.toLocaleString('id-ID')}
                  </div>
                  {currentPrice.isWholesale && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 mt-1 text-xs">
                      {currentPrice.variantName}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs md:text-sm text-gray-600">Stok</div>
                  <div className="font-semibold text-sm md:text-base">{product.current_stock}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantity and Add to Cart - Mobile Optimized */}
        <Card>
          <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm md:text-base">Kuantitas</span>
              <div className="flex items-center gap-2 md:gap-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-8 w-8 md:h-9 md:w-9 p-0"
                >
                  <Minus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <span className="w-8 md:w-12 text-center font-medium text-sm md:text-base">{quantity}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                  className="h-8 w-8 md:h-9 md:w-9 p-0"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 md:pt-4 border-t">
              <span className="font-medium text-sm md:text-base">Total</span>
              <span className="text-lg md:text-xl font-bold text-blue-600">
                Rp {(currentPrice.price * quantity).toLocaleString('id-ID')}
              </span>
            </div>

            <Button 
              className="w-full text-sm md:text-base py-2 md:py-3" 
              onClick={handleAddToCart}
              disabled={product.current_stock === 0}
            >
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              {product.current_stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
            </Button>
          </CardContent>
        </Card>

        {/* Description - Compact for mobile */}
        {product.description && (
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Deskripsi</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Price Variants - Mobile Optimized */}
        {product.price_variants && product.price_variants.length > 0 && (
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Harga Grosir</h2>
              <div className="space-y-2">
                {product.price_variants
                  .filter(variant => variant.is_active)
                  .sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                  .map(variant => (
                    <div key={variant.id} className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs md:text-sm font-medium">{variant.name}</span>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600 text-sm md:text-base">
                          Rp {variant.price.toLocaleString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min. {variant.minimum_quantity} pcs
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <Card>
            <CardContent className="p-4 md:p-6">
              <h2 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Produk Terkait</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    onClick={() => handleRelatedProductClick(relatedProduct.id)}
                    className="bg-white border rounded-lg p-2 md:p-3 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                      {relatedProduct.image_url ? (
                        <img 
                          src={relatedProduct.image_url} 
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-xs md:text-sm line-clamp-2 mb-1">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-blue-600 font-semibold text-xs md:text-sm">
                      Rp {relatedProduct.selling_price.toLocaleString('id-ID')}
                    </p>
                    <div className="mt-1">
                      <Badge 
                        variant={relatedProduct.current_stock > 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {relatedProduct.current_stock > 0 ? `Stok: ${relatedProduct.current_stock}` : 'Habis'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
