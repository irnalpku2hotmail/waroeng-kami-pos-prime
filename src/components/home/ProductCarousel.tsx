
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Package } from 'lucide-react';
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
  min_stock: number;
  loyalty_points: number;
  categories?: { name: string } | null;
}

interface ProductCarouselProps {
  onProductClick?: (product: Product) => void;
}

const ProductCarousel = ({ onProductClick }: ProductCarouselProps) => {
  const { user } = useAuth();
  const { addItem } = useCart();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-6xl text-blue-300">📦</div>
                    )}
                  </div>
                  
                  {/* Category Badge */}
                  {product.categories && (
                    <Badge className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs">
                      {product.categories.name}
                    </Badge>
                  )}
                  
                  {/* Stock Status */}
                  {product.current_stock <= 0 ? (
                    <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                      Habis
                    </Badge>
                  ) : product.current_stock <= product.min_stock ? (
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

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-blue-600">
                      Rp {product.selling_price.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      +{product.loyalty_points} poin
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Stok: {product.current_stock}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    className="w-full text-xs h-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={product.current_stock <= 0}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {product.current_stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
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

export default ProductCarousel;
