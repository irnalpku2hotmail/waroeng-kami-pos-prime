
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Minus, Plus, ShoppingCart, Star, Package } from 'lucide-react';
import HomeNavbar from '@/components/home/HomeNavbar';
import FrontendCartModal from '@/components/frontend/FrontendCartModal';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cartModalOpen, setCartModalOpen] = useState(false);

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
            name,
            description
          ),
          units (
            id,
            name,
            abbreviation
          ),
          price_variants (
            id,
            name,
            price,
            minimum_quantity,
            is_active
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Fetch store info for navbar
  const { data: storeInfo } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['store_name', 'store_address', 'store_phone', 'store_email']);

      if (error) throw error;

      const settings: Record<string, any> = {};
      data.forEach(setting => {
        settings[setting.key] = setting.value;
      });

      const extractStringValue = (value: any, defaultValue: string): string => {
        if (!value) return defaultValue;
        
        if (typeof value === 'object' && value !== null) {
          if ('name' in value && typeof value.name === 'string') {
            return value.name;
          }
          if ('email' in value && typeof value.email === 'string') {
            return value.email;
          }
          if ('address' in value && typeof value.address === 'string') {
            return value.address;
          }
          if ('phone' in value && typeof value.phone === 'string') {
            return value.phone;
          }
          return defaultValue;
        }
        
        if (typeof value === 'string') {
          return value;
        }
        
        return String(value) || defaultValue;
      };

      return {
        name: extractStringValue(settings.store_name, 'Waroeng Kami'),
        address: extractStringValue(settings.store_address, 'Jl. Contoh No. 123, Jakarta'),
        phone: extractStringValue(settings.store_phone, '+62 812-3456-7890'),
        email: extractStringValue(settings.store_email, 'info@waroengkami.com')
      };
    },
  });

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return selectedVariant.price;
    }
    return product?.selling_price || 0;
  };

  const getMinQuantity = () => {
    if (selectedVariant) {
      return selectedVariant.minimum_quantity;
    }
    return product?.min_quantity || 1;
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

    if (product.current_stock < quantity) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${product.current_stock} items available`,
        variant: 'destructive'
      });
      return;
    }

    const minQty = getMinQuantity();
    if (quantity < minQty) {
      toast({
        title: 'Minimum Quantity Required',
        description: `Minimum quantity is ${minQty}`,
        variant: 'destructive'
      });
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: getCurrentPrice(),
      image: product.image_url,
      quantity: quantity,
      variant: selectedVariant?.name
    });

    toast({
      title: 'Added to Cart',
      description: `${quantity}x ${product.name} added to cart`
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleCartClick = () => {
    setCartModalOpen(true);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <HomeNavbar 
          storeInfo={storeInfo}
          onCartClick={handleCartClick}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onSearch={handleSearch}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <HomeNavbar 
          storeInfo={storeInfo}
          onCartClick={handleCartClick}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onSearch={handleSearch}
        />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HomeNavbar 
        storeInfo={storeInfo}
        onCartClick={handleCartClick}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{product.categories?.name}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
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
              <div className="flex items-center gap-2 mb-2">
                {product.categories && (
                  <Badge variant="secondary" className="text-sm">
                    {product.categories.name}
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600">4.5 (120 reviews)</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-blue-600">
                  Rp {getCurrentPrice().toLocaleString('id-ID')}
                </span>
                {selectedVariant && (
                  <Badge className="bg-green-100 text-green-800">
                    {selectedVariant.name}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>Stok: {product.current_stock}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Unit: {product.units?.name || 'pcs'}</span>
                </div>
              </div>
            </div>

            {/* Price Variants */}
            {product.price_variants && product.price_variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Pilih Varian:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.price_variants
                    .filter((variant: any) => variant.is_active)
                    .map((variant: any) => (
                    <Card 
                      key={variant.id}
                      className={`cursor-pointer transition-colors ${
                        selectedVariant?.id === variant.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <CardContent className="p-3">
                        <div className="text-sm font-medium">{variant.name}</div>
                        <div className="text-xs text-gray-600">
                          Min: {variant.minimum_quantity} pcs
                        </div>
                        <div className="text-sm font-bold text-blue-600">
                          Rp {variant.price.toLocaleString('id-ID')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-semibold">Deskripsi:</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <h3 className="font-semibold">Jumlah:</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-medium text-lg px-4">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                  disabled={quantity >= product.current_stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  ({product.current_stock} tersedia)
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Minimum pembelian: {getMinQuantity()} pcs
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.current_stock === 0 || quantity < getMinQuantity()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.current_stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </Button>
              
              <Button
                onClick={handleBuyNow}
                disabled={product.current_stock === 0 || quantity < getMinQuantity()}
                variant="outline"
                className="w-full py-3"
                size="lg"
              >
                Beli Sekarang
              </Button>
            </div>
          </div>
        </div>
      </main>

      <FrontendCartModal 
        open={cartModalOpen} 
        onOpenChange={setCartModalOpen} 
      />
    </div>
  );
};

export default ProductDetail;
