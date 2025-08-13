import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star, 
  Minus, 
  Plus,
  ArrowLeft,
  Package,
  Truck,
  Shield,
  Clock
} from 'lucide-react';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import CartModal from '@/components/CartModal';
import ProductReviews from '@/components/ProductReviews';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.category_id, id],
    queryFn: async () => {
      if (!product?.category_id) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', product.category_id)
        .neq('id', id)
        .limit(5);

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!product?.category_id,
  });

  useEffect(() => {
    // Check if the user has liked the product
    const checkLikeStatus = async () => {
      if (!user || !id) return;

      const { data, error } = await supabase
        .from('user_product_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching like status:', error);
        return;
      }

      setIsLiked(!!data);
    };

    checkLikeStatus();
  }, [user, id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getImageUrl = (imageName: string | null | undefined) => {
    if (!imageName) {
        return '/placeholder.svg';
    }
    if (imageName.startsWith('http')) {
        return imageName;
    }
    const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(imageName);
    
    return data?.publicUrl || '/placeholder.svg';
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
      title: "Produk ditambahkan",
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  const handleToggleLike = async () => {
    if (!user) {
      toast({
        title: 'Anda harus login',
        description: 'Silakan login untuk menyukai produk',
        variant: 'destructive',
      });
      return;
    }

    if (isLiked) {
      // Unlike the product
      const { error } = await supabase
        .from('user_product_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);

      if (error) {
        toast({
          title: 'Gagal unlike produk',
          description: 'Terjadi kesalahan saat unlike produk',
          variant: 'destructive',
        });
        return;
      }

      setIsLiked(false);
      toast({
        title: 'Produk tidak disukai',
        description: 'Anda tidak lagi menyukai produk ini',
      });
    } else {
      // Like the product
      const { error } = await supabase
        .from('user_product_likes')
        .insert([{ user_id: user.id, product_id: id }]);

      if (error) {
        toast({
          title: 'Gagal menyukai produk',
          description: 'Terjadi kesalahan saat menyukai produk',
          variant: 'destructive',
        });
        return;
      }

      setIsLiked(true);
      toast({
        title: 'Produk disukai',
        description: 'Anda menyukai produk ini',
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      })
      .then(() => console.log('Successful share'))
      .catch((error) => console.error('Error sharing', error));
    } else {
      toast({
        title: 'Web Share API tidak didukung',
        description: 'Fitur berbagi tidak didukung di browser ini',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      {isLoading && (
        <div className="text-center py-8">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500">Memuat produk...</p>
        </div>
      )}

      {isError && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Produk tidak ditemukan
          </h2>
          <p className="text-gray-500 mb-4">
            Maaf, produk yang Anda cari tidak ditemukan.
          </p>
          <Button onClick={() => navigate('/')}>
            Kembali ke Beranda
          </Button>
        </div>
      )}

      {product && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Product Images - Mobile Responsive */}
            <div className="space-y-4">
              <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
                <img
                  src={getImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image thumbnails for mobile - smaller size */}
              {product.image_url && (
                <div className="flex gap-2 overflow-x-auto">
                  <div 
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-white rounded-lg overflow-hidden cursor-pointer border-2 ${
                      selectedImage === 0 ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedImage(0)}
                  >
                    <img
                      src={getImageUrl(product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Product Info - Mobile Responsive */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{product.categories?.name}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">4.5 (128 ulasan)</span>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl md:text-3xl font-bold text-blue-600">
                    {formatPrice(product.selling_price)}
                  </span>
                  {product.base_price < product.selling_price && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.base_price)}
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">{product.description}</p>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Stok: <span className="font-medium">{product.current_stock}</span>
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="font-medium">Jumlah:</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                    disabled={quantity >= product.current_stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handleAddToCart}
                  disabled={product.current_stock === 0}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Tambah ke Keranjang
                </Button>
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={handleToggleLike}
                  className="sm:w-auto"
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={handleShare}
                  className="sm:w-auto"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Product Features - Mobile Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Gratis Ongkir</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Garansi Resmi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="text-sm">Kirim Hari Ini</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl md:text-2xl font-bold mb-6">Produk Terkait</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <Card 
                    key={relatedProduct.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/product/${relatedProduct.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                        <img
                          src={getImageUrl(relatedProduct.image_url)}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-medium text-sm mb-2 line-clamp-2">{relatedProduct.name}</h3>
                      <p className="text-blue-600 font-bold text-sm">
                        {formatPrice(relatedProduct.selling_price)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Product Reviews */}
          <div className="mt-12">
            <ProductReviews productId={id!} />
          </div>
        </div>
      )}

      <HomeFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default ProductDetails;
