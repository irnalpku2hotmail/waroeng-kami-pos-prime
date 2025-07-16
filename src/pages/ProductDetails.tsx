
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Plus, Minus, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import ProductRecommendations from '@/components/ProductRecommendations';

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

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!product) {
    return <div className="p-4">Product not found</div>;
  }

  const currentPrice = getBestPrice(quantity);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-semibold">Detail Produk</h1>
          </div>
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Image and Basic Info */}
        <Card>
          <CardContent className="p-0">
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <img 
                src={product.image_url || '/placeholder.svg'} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                {product.categories && (
                  <Badge variant="secondary" className="mb-2">
                    {product.categories.name}
                  </Badge>
                )}
                <h1 className="text-xl font-bold">{product.name}</h1>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    Rp {currentPrice.price.toLocaleString('id-ID')}
                  </div>
                  {currentPrice.isWholesale && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 mt-1">
                      {currentPrice.variantName}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Stok</div>
                  <div className="font-semibold">{product.current_stock}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantity and Add to Cart */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Kuantitas</span>
              <div className="flex items-center gap-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold text-blue-600">
                Rp {(currentPrice.price * quantity).toLocaleString('id-ID')}
              </span>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleAddToCart}
              disabled={product.current_stock === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.current_stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
            </Button>
          </CardContent>
        </Card>

        {/* Description */}
        {product.description && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3">Deskripsi</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Price Variants */}
        {product.price_variants && product.price_variants.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold mb-3">Harga Grosir</h2>
              <div className="space-y-2">
                {product.price_variants
                  .filter(variant => variant.is_active)
                  .sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                  .map(variant => (
                    <div key={variant.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{variant.name}</span>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">
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

        {/* Product Recommendations */}
        <ProductRecommendations 
          categoryId={product.category_id} 
          currentProductId={product.id} 
        />
      </div>
    </div>
  );
};

export default ProductDetails;
