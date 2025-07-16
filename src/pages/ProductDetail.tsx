
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Star, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
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

  const { data: similarProducts } = useQuery({
    queryKey: ['similar-products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', id)
        .eq('is_active', true)
        .limit(4);

      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id
  });

  const getBestPrice = (quantity: number) => {
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
      if (quantity >= variant.minimum_quantity) {
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
    addToCart({
      id: product.id,
      name: product.name,
      price: priceInfo.price,
      quantity: quantity,
      image: product.image_url || undefined,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: priceInfo.price,
      total_price: priceInfo.price * quantity,
      product: {
        id: product.id,
        name: product.name,
        image_url: product.image_url
      }
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
      <div className="bg-white shadow-sm p-4">
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
      </div>

      <div className="p-4 space-y-6">
        {/* Product Image and Info */}
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={product.image_url || '/placeholder.svg'} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  {product.categories && (
                    <Badge variant="secondary" className="mb-2">
                      {product.categories.name}
                    </Badge>
                  )}
                  <h1 className="text-2xl font-bold">{product.name}</h1>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-blue-600">
                      Rp {currentPrice.price.toLocaleString('id-ID')}
                    </span>
                    {currentPrice.isWholesale && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        {currentPrice.variantName}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>4.5 (120 ulasan)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stok:</span>
                    <span className="font-medium">{product.current_stock} tersedia</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Kuantitas:</span>
                    <div className="flex items-center gap-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{quantity}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      Rp {(currentPrice.price * quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {product.description && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-3">Deskripsi Produk</h2>
              <p className="text-gray-600">{product.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Price Variants */}
        {product.price_variants && product.price_variants.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-3">Harga Grosir</h2>
              <div className="space-y-2">
                {product.price_variants
                  .filter(variant => variant.is_active)
                  .sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                  .map(variant => (
                    <div key={variant.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{variant.name}</span>
                      <div className="text-right">
                        <div className="font-semibold">Rp {variant.price.toLocaleString('id-ID')}</div>
                        <div className="text-xs text-gray-500">Min. {variant.minimum_quantity} pcs</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Produk Serupa</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {similarProducts.map(similarProduct => (
                  <div 
                    key={similarProduct.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/product/${similarProduct.id}`)}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                      <img 
                        src={similarProduct.image_url || '/placeholder.svg'} 
                        alt={similarProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-sm font-medium line-clamp-2 mb-1">{similarProduct.name}</h3>
                    <p className="text-blue-600 font-semibold">
                      Rp {similarProduct.selling_price.toLocaleString('id-ID')}
                    </p>
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

export default ProductDetail;
