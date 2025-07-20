
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Package,
  ArrowLeft,
  Plus,
  Minus,
  Info,
  Shield,
  Truck
} from 'lucide-react';
import ProductReviews from '@/components/ProductReviews';
import { useProductLikes } from '@/hooks/useProductLikes';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import CartModal from '@/components/CartModal';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isLiked, toggleLike } = useProductLikes(id || '');

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name),
          units (name, abbreviation),
          product_brands (name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          selling_price,
          image_url,
          current_stock,
          categories (name)
        `)
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(6);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.category_id
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.current_stock < quantity) {
      toast({
        title: 'Stok tidak mencukupi',
        description: `Stok tersedia hanya ${product.current_stock}`,
        variant: 'destructive'
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: quantity,
      image: product.image_url,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: product.selling_price,
      total_price: product.selling_price * quantity,
      product: {
        id: product.id,
        name: product.name,
        image_url: product.image_url
      }
    });

    toast({
      title: 'Berhasil!',
      description: `${quantity} ${product.name} telah ditambahkan ke keranjang`,
    });
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.current_stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeNavbar 
          onCartClick={() => setCartModalOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-500">Memuat detail produk...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeNavbar 
          onCartClick={() => setCartModalOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Produk tidak ditemukan</h2>
            <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-20 w-20 text-gray-400" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.categories && (
                <Badge variant="secondary" className="mb-2">
                  {product.categories.name}
                </Badge>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              {product.product_brands && (
                <p className="text-gray-600 mb-4">Brand: {product.product_brands.name}</p>
              )}
              <div className="text-3xl font-bold text-blue-600 mb-4">
                {formatPrice(product.selling_price)}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={product.current_stock > 0 ? 'default' : 'destructive'}
                className="text-sm"
              >
                {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Stok Habis'}
              </Badge>
              {product.units && (
                <span className="text-sm text-gray-600">per {product.units.name}</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Deskripsi Produk</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            {product.current_stock > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah
                  </label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-lg px-4">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={increaseQuantity}
                      disabled={quantity >= product.current_stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Tambah ke Keranjang
                  </Button>
                  <Button
                    variant="outline"
                    onClick={toggleLike}
                    size="lg"
                    className={isLiked ? 'text-red-600 border-red-200' : ''}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="outline" size="lg">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Product Features */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-green-600" />
                <span>Produk Original & Berkualitas</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="h-5 w-5 text-blue-600" />
                <span>Pengiriman Cepat & Aman</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Info className="h-5 w-5 text-orange-600" />
                <span>Garansi Sesuai Ketentuan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Produk Terkait</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Card 
                  key={relatedProduct.id}
                  className="group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                      {relatedProduct.image_url ? (
                        <img 
                          src={relatedProduct.image_url} 
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2 h-10">
                        {relatedProduct.name}
                      </h3>
                      
                      <p className="text-lg font-bold text-blue-600">
                        {formatPrice(relatedProduct.selling_price)}
                      </p>
                      
                      <Badge 
                        variant={relatedProduct.current_stock > 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {relatedProduct.current_stock > 0 ? `Stok: ${relatedProduct.current_stock}` : 'Habis'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-8" />

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />
      </div>

      <HomeFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default ProductDetails;
