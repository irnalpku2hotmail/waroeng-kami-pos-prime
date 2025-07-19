
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Package, Star, Minus, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
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
      description: `${product.name} (${quantity}) telah ditambahkan ke keranjang`,
    });
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
          onCartClick={() => {}}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
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
          onCartClick={() => {}}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Produk tidak ditemukan</h2>
            <Button onClick={() => navigate(-1)}>Kembali</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar 
        onCartClick={() => {}}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image */}
          <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Package className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {product.categories && (
              <Badge variant="secondary" className="text-sm">
                {product.categories.name}
              </Badge>
            )}

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-500">(4.8)</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-4xl font-bold text-blue-600">
                {formatPrice(product.selling_price)}
              </p>
              {product.base_price !== product.selling_price && (
                <p className="text-lg text-gray-500 line-through">
                  {formatPrice(product.base_price)}
                </p>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Deskripsi</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Stok tersedia:</span>
                <Badge variant={product.current_stock > 0 ? 'default' : 'destructive'}>
                  {product.current_stock > 0 ? `${product.current_stock} ${product.units?.abbreviation || 'pcs'}` : 'Habis'}
                </Badge>
              </div>

              {product.current_stock > 0 && (
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
                      <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
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

                  <Button
                    onClick={handleAddToCart}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Tambah ke Keranjang - {formatPrice(product.selling_price * quantity)}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informasi Produk</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Kategori:</span>
                <span className="ml-2 text-gray-600">{product.categories?.name || 'Tidak ada kategori'}</span>
              </div>
              <div>
                <span className="font-medium">Satuan:</span>
                <span className="ml-2 text-gray-600">{product.units?.name || 'Tidak ada satuan'}</span>
              </div>
              <div>
                <span className="font-medium">Minimum Order:</span>
                <span className="ml-2 text-gray-600">{product.min_quantity} {product.units?.abbreviation || 'pcs'}</span>
              </div>
              <div>
                <span className="font-medium">Point Loyalitas:</span>
                <span className="ml-2 text-gray-600">{product.loyalty_points} poin</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <HomeFooter />
    </div>
  );
};

export default ProductDetail;
