
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Package, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProductLikes } from '@/hooks/useProductLikes';
import { toast } from '@/hooks/use-toast';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import CartModal from '@/components/CartModal';
import ProductReviews from '@/components/ProductReviews';
import ProductSimilarCarousel from '@/components/ProductSimilarCarousel';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { likedProducts, toggleLike } = useProductLikes();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation),
          product_brands (name, logo_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
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
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const isLiked = product ? likedProducts.includes(product.id) : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeNavbar 
          onCartClick={() => setCartModalOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
        />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Memuat produk...</p>
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Produk tidak ditemukan</p>
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
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  {product.categories && (
                    <Badge variant="secondary" className="mb-2">
                      {product.categories.name}
                    </Badge>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h1>
                  {product.product_brands && (
                    <p className="text-sm text-gray-600 mb-2">
                      Brand: {product.product_brands.name}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleLike(product.id)}
                  className={isLiked ? 'text-red-500' : ''}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatPrice(product.selling_price)}
                  </p>
                  {product.base_price !== product.selling_price && (
                    <p className="text-lg text-gray-500 line-through">
                      {formatPrice(product.base_price)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Badge 
                    variant={product.current_stock > 0 ? 'default' : 'destructive'}
                  >
                    {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
                  </Badge>
                  {product.units && (
                    <span className="text-sm text-gray-600">
                      per {product.units.name}
                    </span>
                  )}
                </div>

                {product.description && (
                  <div>
                    <h3 className="font-medium mb-2">Deskripsi</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-medium">Jumlah:</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                    disabled={quantity >= product.current_stock}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={product.current_stock === 0}
                className="w-full"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Tambah ke Keranjang
              </Button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        <ProductSimilarCarousel 
          currentProductId={product.id}
          categoryId={product.category_id}
        />

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />
      </div>

      <HomeFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default ProductDetail;
