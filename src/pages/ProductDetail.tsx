
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft, Package, Star, Heart, Share2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import HomeNavbar from '@/components/home/HomeNavbar';
import EnhancedFooter from '@/components/home/EnhancedFooter';
import CartModal from '@/components/CartModal';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Fetch product details
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
          product_brands (name, logo_url)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch related products
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
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
      description: `${product.name} (${quantity}x) telah ditambahkan ke keranjang`,
    });
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <HomeNavbar 
          onCartClick={() => setCartModalOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
        />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-3xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <HomeNavbar 
          onCartClick={() => setCartModalOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
        />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <Package className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Produk tidak ditemukan</h2>
            <p className="text-gray-600 mb-6">Produk yang Anda cari tidak tersedia</p>
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <HomeNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Image */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden">
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
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="space-y-6">
                {/* Category & Brand */}
                <div className="flex items-center gap-3">
                  {product.categories && (
                    <Badge className="bg-blue-600 text-white px-3 py-1">
                      {product.categories.name}
                    </Badge>
                  )}
                  {product.product_brands && (
                    <Badge variant="outline" className="px-3 py-1">
                      {product.product_brands.name}
                    </Badge>
                  )}
                </div>

                {/* Product Name */}
                <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>

                {/* Price */}
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-blue-600">
                    {formatPrice(product.selling_price)}
                  </p>
                  {product.units && (
                    <p className="text-gray-600">
                      per {product.units.name} ({product.units.abbreviation})
                    </p>
                  )}
                </div>

                {/* Stock */}
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={product.current_stock > 0 ? 'default' : 'destructive'}
                    className="px-4 py-2 text-sm"
                  >
                    {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Stok Habis'}
                  </Badge>
                  {product.current_stock <= 10 && product.current_stock > 0 && (
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Stok Terbatas
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="p-4 bg-gray-50/50 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">Deskripsi Produk</h3>
                    <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Quantity Selector & Add to Cart */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-700">Jumlah:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-10 w-10 p-0 rounded-full"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                        disabled={quantity >= product.current_stock}
                        className="h-10 w-10 p-0 rounded-full"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleAddToCart}
                      disabled={product.current_stock === 0}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-medium rounded-2xl shadow-lg"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Tambah ke Keranjang
                    </Button>
                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
                Produk Terkait
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Card 
                    key={relatedProduct.id}
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm border-0 shadow-md hover:scale-105 rounded-xl overflow-hidden"
                    onClick={() => navigate(`/product/${relatedProduct.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {relatedProduct.image_url ? (
                          <img 
                            src={relatedProduct.image_url} 
                            alt={relatedProduct.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 space-y-2">
                        <h3 className="font-medium text-sm line-clamp-2 text-gray-800 min-h-[2rem]">
                          {relatedProduct.name}
                        </h3>
                        <p className="text-sm font-bold text-blue-600">
                          {formatPrice(relatedProduct.selling_price)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <EnhancedFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default ProductDetail;
