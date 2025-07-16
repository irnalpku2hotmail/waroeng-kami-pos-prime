
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Search, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import HomeFooter from '@/components/home/HomeFooter';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const query = searchParams.get('q') || '';

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['search-products', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!query.trim()
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image: product.image_url,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: product.selling_price,
      total_price: product.selling_price * 1,
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

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">Hasil Pencarian</h1>
            <p className="text-sm text-gray-600">"{query}"</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-500">Mencari produk...</p>
          </div>
        )}

        {!isLoading && products.length === 0 && query.trim() && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Tidak ada hasil ditemukan
            </h2>
            <p className="text-gray-500">
              Coba gunakan kata kunci yang berbeda atau lebih umum
            </p>
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Ditemukan {products.length} produk untuk "{query}"
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {products.map((product) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {product.categories && (
                        <Badge variant="secondary" className="text-xs">
                          {product.categories.name}
                        </Badge>
                      )}
                      
                      <h3 className="font-medium text-sm line-clamp-2 h-10">
                        {product.name}
                      </h3>
                      
                      <p className="text-lg font-bold text-blue-600">
                        {formatPrice(product.selling_price)}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={product.current_stock > 0 ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
                        </Badge>
                        
                        <Button
                          size="sm"
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={product.current_stock === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <HomeFooter />
    </div>
  );
};

export default SearchResults;
