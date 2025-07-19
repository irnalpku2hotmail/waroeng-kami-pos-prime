
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, Star, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useCartWithShipping } from '@/hooks/useCartWithShipping';
import { toast } from '@/hooks/use-toast';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import ProductSimilarCarousel from '@/components/ProductSimilarCarousel';
import ProductReviews from '@/components/ProductReviews';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartWithShipping();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          product_brands(name, logo_url),
          price_variants(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: reviews } = useQuery({
    queryKey: ['product-reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    const totalStock = product.current_stock;
    if (quantity > totalStock) {
      toast({
        title: 'Stok tidak mencukupi',
        description: `Stok tersedia: ${totalStock}`,
        variant: 'destructive'
      });
      return;
    }

    const finalPrice = getCurrentPrice();
    
    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image_url || '/placeholder.svg',
      quantity
    });

    toast({
      title: 'Berhasil ditambahkan',
      description: `${product.name} telah ditambahkan ke keranjang`
    });
  };

  const getCurrentPrice = () => {
    if (!product) return 0;
    
    // Check for price variants based on quantity
    const applicableVariant = product.price_variants
      ?.filter((variant: any) => variant.is_active && quantity >= variant.minimum_quantity)
      .sort((a: any, b: any) => b.minimum_quantity - a.minimum_quantity)[0];
    
    return applicableVariant ? applicableVariant.price : product.selling_price;
  };

  const adjustQuantity = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product?.current_stock) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
        <HomeFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Produk tidak ditemukan</h1>
          </div>
        </div>
        <HomeFooter />
      </div>
    );
  }

  const averageRating = reviews?.length ? 
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const currentPrice = getCurrentPrice();

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-white">
            <img
              src={product.image_url || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
              
              {/* Rating */}
              {reviews && reviews.length > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {averageRating.toFixed(1)} ({reviews.length} ulasan)
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-blue-600">
                  Rp {currentPrice.toLocaleString('id-ID')}
                </span>
                {currentPrice !== product.selling_price && (
                  <span className="text-lg text-gray-500 line-through">
                    Rp {product.selling_price.toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <Badge variant="secondary">
                  Stok: {product.current_stock}
                </Badge>
                <Badge variant="outline">
                  {product.categories?.name || 'Tanpa Kategori'}
                </Badge>
                {product.product_brands && (
                  <Badge variant="outline">
                    {product.product_brands.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Deskripsi</h3>
              <p className="text-gray-600">{product.description || 'Tidak ada deskripsi'}</p>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Jumlah:</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustQuantity(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustQuantity(1)}
                  disabled={quantity >= product.current_stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-500">
                (Minimal: {product.min_quantity})
              </span>
            </div>

            {/* Price Variants Info */}
            {product.price_variants && product.price_variants.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Harga Bertingkat:</h4>
                <div className="space-y-1">
                  {product.price_variants
                    .filter((variant: any) => variant.is_active)
                    .sort((a: any, b: any) => a.minimum_quantity - b.minimum_quantity)
                    .map((variant: any) => (
                      <div key={variant.id} className="text-sm">
                        {variant.minimum_quantity}+ pcs: Rp {variant.price.toLocaleString('id-ID')}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={handleAddToCart}
                className="flex-1"
                disabled={product.current_stock < 1}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Tambah ke Keranjang
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        <ProductSimilarCarousel productId={product.id} categoryId={product.category_id} />

        {/* Reviews */}
        <ProductReviews productId={product.id} />
      </div>

      <HomeFooter />
    </div>
  );
};

export default ProductDetail;
