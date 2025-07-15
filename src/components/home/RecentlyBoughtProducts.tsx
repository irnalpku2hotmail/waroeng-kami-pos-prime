
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, RotateCcw } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface Product {
  id: string;
  name: string;
  selling_price: number;
  image_url: string | null;
  current_stock: number;
  last_bought?: string;
}

interface RecentlyBoughtProductsProps {
  onProductClick?: (product: Product) => void;
}

const RecentlyBoughtProducts = ({ onProductClick }: RecentlyBoughtProductsProps) => {
  const { user } = useAuth();
  const { addItem } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['recently-bought-products', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          product_id,
          created_at,
          products (
            id,
            name,
            selling_price,
            image_url,
            current_stock,
            is_active
          ),
          transactions!inner (
            cashier_id
          )
        `)
        .eq('transactions.cashier_id', user.id)
        .eq('products.is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Group by product and get unique products with last bought date
      const uniqueProducts = data.reduce((acc: any[], item: any) => {
        if (!item.products) return acc;
        
        const existingIndex = acc.findIndex(p => p.id === item.products.id);
        if (existingIndex === -1) {
          acc.push({
            ...item.products,
            last_bought: item.created_at
          });
        }
        return acc;
      }, []);

      return uniqueProducts.slice(0, 10);
    },
    enabled: !!user
  });

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Silakan login untuk menambahkan produk ke keranjang',
        variant: 'destructive'
      });
      return;
    }

    addItem(product);
    toast({
      title: 'Berhasil',
      description: `${product.name} telah ditambahkan ke keranjang`
    });
  };

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Silakan login untuk melihat produk yang pernah dibeli</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Belum ada produk yang pernah dibeli</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product) => (
            <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <Card 
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50"
                onClick={() => handleProductClick(product)}
              >
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-green-50 to-teal-100 p-4 flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-6xl text-green-300">📦</div>
                    )}
                  </div>
                  
                  {/* Rebuy Badge */}
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs px-2 py-1 flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    Beli Lagi
                  </Badge>
                  
                  {/* Stock Status */}
                  {product.current_stock <= 0 ? (
                    <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                      Habis
                    </Badge>
                  ) : product.current_stock <= 10 ? (
                    <Badge variant="secondary" className="absolute top-2 right-2 text-xs bg-orange-100 text-orange-800">
                      Sisa {product.current_stock}
                    </Badge>
                  ) : null}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 h-10">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">(4.5)</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-blue-600">
                      Rp {product.selling_price.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.last_bought && new Date(product.last_bought).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    className="w-full text-xs h-8 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={product.current_stock <= 0}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {product.current_stock <= 0 ? 'Stok Habis' : 'Beli Lagi'}
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default RecentlyBoughtProducts;
