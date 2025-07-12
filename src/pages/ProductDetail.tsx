import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, Star, Package, ArrowLeft, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import ProductRecommendations from '@/components/ProductRecommendations';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Check if product is liked by user
  const { data: liked } = useQuery({
    queryKey: ['product-like', id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('user_product_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      return !error && data;
    },
    enabled: !!user && !!id
  });

  useEffect(() => {
    if (liked) {
      setIsLiked(true);
    }
  }, [liked]);

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login required');
      
      if (isLiked) {
        const { error } = await supabase
          .from('user_product_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_product_likes')
          .insert({
            user_id: user.id,
            product_id: id
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ['product-like', id, user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: 'Login Diperlukan',
        description: 'Silakan login terlebih dahulu untuk menambah produk ke keranjang.',
        variant: 'destructive'
      });
      return;
    }

    if (product.current_stock <= 0) {
      toast({
        title: 'Stok Habis',
        description: 'Produk ini sedang tidak tersedia.',
        variant: 'destructive'
      });
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    
    toast({
      title: 'Berhasil',
      description: `${quantity} ${product.name} ditambahkan ke keranjang.`
    });
  };

  const handleToggleLike = () => {
    if (!user) {
      toast({
        title: 'Login Diperlukan',
        description: 'Silakan login untuk menyukai produk.',
        variant: 'destructive'
      });
      return;
    }
    
    toggleLikeMutation.mutate();
  };

  const handleRecommendationClick = (recommendedProduct: any) => {
    navigate(`/product/${recommendedProduct.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeNavbar storeName="TokoQu" searchTerm="" onSearchChange={() => {}} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeNavbar storeName="TokoQu" searchTerm="" onSearchChange={() => {}} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Produk tidak ditemukan</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar storeName="TokoQu" searchTerm="" onSearchChange={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
              <img
                src={product.image_url || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600">
                Kategori: {product.categories?.name || 'Tidak ada kategori'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-blue-600">
                Rp {Number(product.selling_price).toLocaleString('id-ID')}
              </span>
              {product.current_stock <= 0 ? (
                <Badge variant="destructive">Stok Habis</Badge>
              ) : product.current_stock <= product.min_stock ? (
                <Badge className="bg-orange-500">Stok Terbatas</Badge>
              ) : (
                <Badge className="bg-green-500">Tersedia</Badge>
              )}
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Stok: {product.current_stock}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>4.5 (120 ulasan)</span>
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Deskripsi Produk</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">Jumlah:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                    disabled={quantity >= product.current_stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleToggleLike}
                  variant="outline"
                  className={`flex-1 ${isLiked ? 'text-red-500 border-red-500' : ''}`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {isLiked ? 'Disukai' : 'Suka'}
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={product.current_stock <= 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.current_stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Recommendations */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Rekomendasi Produk Serupa
          </h2>
          <ProductRecommendations
            categoryId={product.category_id}
            currentProductId={product.id}
            onProductClick={handleRecommendationClick}
          />
        </div>
      </div>

      <HomeFooter />
    </div>
  );
};

export default ProductDetail;
