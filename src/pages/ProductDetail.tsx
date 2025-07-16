
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Package, 
  Truck, 
  Shield,
  ArrowLeft,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import HomeNavbar from '@/components/home/HomeNavbar';

interface Product {
  id: string;
  name: string;
  description: string;
  selling_price: number;
  base_price: number;
  image_url: string;
  current_stock: number;
  category_id: string;
  categories?: {
    id: string;
    name: string;
  };
}

interface PriceVariant {
  id: string;
  name: string;
  minimum_quantity: number;
  price: number;
  is_active: boolean;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(0);

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID is required');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id
  });

  // Fetch price variants
  const { data: priceVariants = [] } = useQuery({
    queryKey: ['price-variants', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('price_variants')
        .select('*')
        .eq('product_id', id)
        .eq('is_active', true)
        .order('minimum_quantity', { ascending: true });

      if (error) throw error;
      return data as PriceVariant[];
    },
    enabled: !!id
  });

  // Fetch similar products (same category)
  const { data: similarProducts = [] } = useQuery({
    queryKey: ['similar-products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(6);

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!product?.category_id
  });

  // Calculate current price based on quantity and variants
  useEffect(() => {
    if (!product) return;

    let calculatedPrice = product.selling_price;

    // Find the best price variant for current quantity
    const applicableVariant = priceVariants
      .filter(variant => quantity >= variant.minimum_quantity)
      .sort((a, b) => b.minimum_quantity - a.minimum_quantity)[0];

    if (applicableVariant) {
      calculatedPrice = applicableVariant.price;
    }

    setCurrentPrice(calculatedPrice);
  }, [quantity, product, priceVariants]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (product && newQuantity > product.current_stock) {
      toast({
        title: 'Stok Tidak Mencukupi',
        description: `Stok tersedia: ${product.current_stock}`,
        variant: 'destructive'
      });
      return;
    }
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to cart',
        variant: 'destructive'
      });
      return;
    }

    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        ...product,
        selling_price: currentPrice
      });
    }

    toast({
      title: 'Berhasil',
      description: `${quantity} ${product.name} ditambahkan ke keranjang`
    });
  };

  const handleSimilarProductClick = (similarProduct: Product) => {
    navigate(`/product/${similarProduct.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Produk tidak ditemukan</h2>
          <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar
        storeInfo={{
          name: 'Waroeng Kami',
          address: '',
          phone: '',
          email: ''
        }}
        onCartClick={() => {}}
        searchTerm=""
        onSearchChange={() => {}}
        onSearch={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
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
              {product.categories && (
                <Badge variant="secondary" className="mb-2">
                  {product.categories.name}
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.5) • 127 ulasan</span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">
                Rp {currentPrice.toLocaleString('id-ID')}
              </div>
              {currentPrice !== product.selling_price && (
                <div className="text-lg text-gray-500 line-through">
                  Rp {product.selling_price.toLocaleString('id-ID')}
                </div>
              )}
              
              {/* Price Variants Info */}
              {priceVariants.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-2">Harga Grosir:</h4>
                  <div className="space-y-1">
                    {priceVariants.map((variant) => (
                      <div key={variant.id} className="text-sm text-blue-700">
                        {variant.minimum_quantity}+ pcs: Rp {variant.price.toLocaleString('id-ID')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Jumlah:</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-medium text-lg w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.current_stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 ml-2">
                  Stok: {product.current_stock}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                className="flex-1"
                disabled={product.current_stock === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.current_stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Product Features */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <Package className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Produk Original</p>
              </div>
              <div className="text-center">
                <Truck className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Pengiriman Cepat</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Garansi Resmi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <Card className="mb-12">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Deskripsi Produk</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description || 'Tidak ada deskripsi tersedia untuk produk ini.'}
            </p>
          </CardContent>
        </Card>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Produk Serupa</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {similarProducts.map((similarProduct) => (
                <Card
                  key={similarProduct.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => handleSimilarProductClick(similarProduct)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
                      <img
                        src={similarProduct.image_url || '/placeholder.svg'}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm line-clamp-2 mb-2">
                        {similarProduct.name}
                      </h4>
                      <p className="font-bold text-blue-600">
                        Rp {similarProduct.selling_price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
