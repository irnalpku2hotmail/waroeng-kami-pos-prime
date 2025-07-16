
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Package, 
  Tag, 
  Star, 
  Plus, 
  Minus,
  ArrowLeft,
  Heart,
  Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(0);

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      
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

  // Fetch similar products
  const { data: similarProducts } = useQuery({
    queryKey: ['similar-products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .eq('is_active', true)
        .limit(4);

      if (error) throw error;
      return data;
    },
    enabled: !!product?.category_id
  });

  // Calculate price based on quantity and price variants
  useEffect(() => {
    if (!product) return;

    let price = product.selling_price;
    
    if (product.price_variants && product.price_variants.length > 0) {
      // Sort variants by minimum quantity desc to get the best applicable price
      const sortedVariants = [...product.price_variants]
        .filter(variant => variant.is_active)
        .sort((a, b) => b.minimum_quantity - a.minimum_quantity);

      for (const variant of sortedVariants) {
        if (quantity >= variant.minimum_quantity) {
          price = variant.price;
          break;
        }
      }
    }

    setCurrentPrice(price);
  }, [product, quantity]);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      quantity,
      image: product.image_url,
      stock: product.current_stock
    });

    toast({
      title: 'Berhasil!',
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Produk tidak ditemukan</h2>
          <Button onClick={() => navigate('/products')}>
            Kembali ke Produk
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Heart className="h-4 w-4 mr-2" />
                  Favorit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Bagikan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">
                  {product.categories?.name || 'Tanpa Kategori'}
                </Badge>
                <Badge variant={product.current_stock > 0 ? 'default' : 'destructive'}>
                  {product.current_stock > 0 ? 'Tersedia' : 'Habis'}
                </Badge>
              </div>
              
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-4 w-4 text-yellow-400 fill-current" 
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(0 ulasan)</span>
              </div>
              
              <div className="text-3xl font-bold text-blue-600 mb-4">
                {formatPrice(currentPrice)}
                {currentPrice !== product.selling_price && (
                  <span className="text-lg text-gray-500 line-through ml-2">
                    {formatPrice(product.selling_price)}
                  </span>
                )}
              </div>
            </div>

            {/* Price Variants Info */}
            {product.price_variants && product.price_variants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Harga Berdasarkan Kuantitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {product.price_variants
                      .filter(variant => variant.is_active)
                      .sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                      .map((variant, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <span>Min. {variant.minimum_quantity} {product.units?.abbreviation}</span>
                          <span className="font-semibold">{formatPrice(variant.price)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quantity and Add to Cart */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Jumlah</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-semibold min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= product.current_stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Stok tersedia: {product.current_stock} {product.units?.abbreviation}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">Total Harga:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(currentPrice * quantity)}
                    </span>
                  </div>

                  <Button
                    onClick={handleAddToCart}
                    disabled={product.current_stock === 0}
                    className="w-full"
                    size="lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {product.current_stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Product Description */}
            {product.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Deskripsi Produk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Product Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Barcode:</span>
                    <span>{product.barcode || 'Tidak ada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit:</span>
                    <span>{product.units?.name || 'Tidak ada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimal Stok:</span>
                    <span>{product.min_stock} {product.units?.abbreviation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Poin Loyalitas:</span>
                    <span>{product.loyalty_points} poin</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Produk Serupa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {similarProducts.map((similarProduct) => (
                  <div
                    key={similarProduct.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/product/${similarProduct.id}`)}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                      {similarProduct.image_url ? (
                        <img 
                          src={similarProduct.image_url} 
                          alt={similarProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium mb-2 line-clamp-2">{similarProduct.name}</h3>
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(similarProduct.selling_price)}
                    </p>
                    <Badge 
                      variant={similarProduct.current_stock > 0 ? 'default' : 'destructive'}
                      className="mt-2"
                    >
                      {similarProduct.current_stock > 0 ? 'Tersedia' : 'Habis'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
