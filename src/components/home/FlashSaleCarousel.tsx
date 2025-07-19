
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Clock, Zap } from 'lucide-react';
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
}

interface FlashSaleItem {
  id: string;
  product_id: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  stock_quantity: number;
  products: Product | null;
  flash_sales: {
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  } | null;
}

interface FlashSaleCarouselProps {
  onProductClick?: (product: Product) => void;
}

const FlashSaleCarousel = ({ onProductClick }: FlashSaleCarouselProps) => {
  const { user } = useAuth();
  const { addItem } = useCart();

  const { data: flashSaleItems = [], isLoading } = useQuery({
    queryKey: ['flash-sale-items'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select(`
          *,
          products!inner(*),
          flash_sales!inner(*)
        `)
        .eq('flash_sales.is_active', true)
        .lte('flash_sales.start_date', now)
        .gte('flash_sales.end_date', now)
        .gt('stock_quantity', 0)
        .order('discount_percentage', { ascending: false });

      if (error) throw error;
      return (data || []) as FlashSaleItem[];
    }
  });

  const handleAddToCart = (product: Product, flashSaleItem: FlashSaleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Silakan login untuk menambahkan produk ke keranjang',
        variant: 'destructive'
      });
      return;
    }

    addItem({ ...product, selling_price: flashSaleItem.sale_price });
    toast({
      title: 'Berhasil',
      description: `${product.name} telah ditambahkan ke keranjang dengan harga flash sale`
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (flashSaleItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Tidak ada flash sale yang aktif saat ini</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full">
          <Zap className="h-5 w-5" />
          <span className="font-semibold">Flash Sale Aktif</span>
          <Clock className="h-4 w-4" />
        </div>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {flashSaleItems.map((item) => (
            <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
              <Card 
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-red-50 to-orange-50"
                onClick={() => item.products && handleProductClick(item.products)}
              >
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-red-100 to-orange-100 p-4 flex items-center justify-center">
                    {item.products?.image_url ? (
                      <img 
                        src={item.products.image_url} 
                        alt={item.products.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-6xl text-red-300">📦</div>
                    )}
                  </div>
                  
                  {/* Flash Sale Badge */}
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-1 animate-pulse">
                    -{item.discount_percentage}%
                  </Badge>
                  
                  {/* Stock Status */}
                  <Badge className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs">
                    {item.stock_quantity} tersisa
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 h-10">
                    {item.products?.name || 'Produk Flash Sale'}
                  </h3>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">(4.8)</span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-red-600">
                        Rp {item.sale_price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-green-600 font-medium">
                        Hemat {((item.original_price - item.sale_price) / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 line-through">
                      Rp {item.original_price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    className="w-full text-xs h-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    onClick={(e) => item.products && handleAddToCart(item.products, item, e)}
                    disabled={item.stock_quantity <= 0}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {item.stock_quantity <= 0 ? 'Habis' : 'Beli Sekarang'}
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

export default FlashSaleCarousel;
