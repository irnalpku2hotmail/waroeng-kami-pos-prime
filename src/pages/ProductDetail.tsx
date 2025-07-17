
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ShoppingCart, Package, Minus, Plus, Star, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import CartModal from '@/components/CartModal';
import ProductSimilarCarousel from '@/components/ProductSimilarCarousel';
import { useAuth } from '@/contexts/AuthContext';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      if (!id) return null;
      
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

  // Check if product is liked
  const { data: likeData } = useQuery({
    queryKey: ['product-like', id, user?.id],
    queryFn: async () => {
      if (!user?.id || !id) return null;
      
      const { data, error } = await supabase
        .from('user_product_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!id
  });

  useEffect(() => {
    if (likeData) {
      setIsLiked(true);
    }
  }, [likeData]);

  useEffect(() => {
    if (product) {
      // Set initial price
      const basePrice = product.selling_price;
      const variants = product.price_variants || [];
      
      if (variants.length > 0) {
        // Find the best variant for quantity 1
        const applicableVariant = variants
          .filter(v => v.is_active && quantity >= v.minimum_quantity)
          .sort((a, b) => b.minimum_quantity - a.minimum_quantity)[0];
        
        if (applicableVariant) {
          setSelectedVariant(applicableVariant);
          setCurrentPrice(applicableVariant.price);
        } else {
          setCurrentPrice(basePrice);
        }
      } else {
        setCurrentPrice(basePrice);
      }
    }
  }, [product, quantity]);

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
      price: currentPrice,
      quantity: quantity,
      image: product.image_url,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: currentPrice,
      total_price: currentPrice * quantity,
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

  const handleLike = async () => {
    if (!user?.id || !id) {
      toast({
        title: 'Info',
        description: 'Silakan login untuk menyimpan produk favorit',
        variant: 'default',
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('user_product_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        setIsLiked(false);
        toast({
          title: 'Berhasil',
          description: 'Produk dihapus dari favorit',
        });
      } else {
        await supabase
          .from('user_product_likes')
          .insert({
            user_id: user.id,
            product_id: id
          });
        setIsLiked(true);
        toast({
          title: 'Berhasil',
          description: 'Produk ditambahkan ke favorit',
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Produk Tidak Ditemukan</h1>
            <Button onClick={() => navigate('/')}>
              Kembali ke Beranda
            </Button>
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
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-16 w-16 text-gray-400" />
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              {product.categories && (
                <Badge variant="secondary">
                  {product.categories.name}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`${isLiked ? 'text-red-500' : 'text-gray-400'}`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {product.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-3xl font-bold text-blue-600">
                  {formatPrice(currentPrice)}
                </span>
                {selectedVariant && (
                  <Badge variant="outline" className="text-xs">
                    Min. {selectedVariant.minimum_quantity} {product.units?.abbreviation || 'unit'}
                  </Badge>
                )}
              </div>
              
              {product.price_variants && product.price_variants.length > 0 && (
                <div className="text-sm text-gray-500">
                  <p className="mb-2">Harga berdasarkan jumlah pembelian:</p>
                  <div className="space-y-1">
                    {product.price_variants
                      .filter(v => v.is_active)
                      .sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                      .map(variant => (
                        <div key={variant.id} className="flex justify-between">
                          <span>{variant.minimum_quantity}+ {product.units?.abbreviation || 'unit'}</span>
                          <span className="font-medium">{formatPrice(variant.price)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <Badge 
                variant={product.current_stock > 0 ? 'default' : 'destructive'}
              >
                {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
              </Badge>
              
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.5</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Jumlah
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                    min="1"
                    max={product.current_stock}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                    disabled={quantity >= product.current_stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-500 ml-2">
                    {product.units?.abbreviation || 'unit'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.current_stock === 0}
                  className="flex-1 flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Tambah ke Keranjang
                </Button>
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  disabled={product.current_stock === 0}
                  className="px-6"
                >
                  Beli Sekarang
                </Button>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>Total: <span className="font-bold text-gray-900">{formatPrice(currentPrice * quantity)}</span></p>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {product.categories && (
          <ProductSimilarCarousel 
            categoryId={product.categories.id} 
            currentProductId={product.id}
          />
        )}
      </div>

      <HomeFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default ProductDetail;
