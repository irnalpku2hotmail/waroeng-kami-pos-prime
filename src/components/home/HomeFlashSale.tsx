
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Clock, Fire, Zap, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

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
  sold_quantity: number;
  products: Product | null;
  flash_sales: {
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  } | null;
}

interface HomeFlashSaleProps {
  onProductClick?: (product: Product) => void;
}

const HomeFlashSale = ({ onProductClick }: HomeFlashSaleProps) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Fetch flash sale products
  const { data: flashSaleProducts = [] } = useQuery({
    queryKey: ['flash-sale-products'],
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
        .limit(6);

      if (error) {
        console.error('Error fetching flash sale products:', error);
        throw error;
      }
      
      return (data || []) as FlashSaleItem[];
    }
  });

  // Calculate countdown timer
  useEffect(() => {
    if (flashSaleProducts.length === 0) return;

    const updateTimer = () => {
      const now = new Date();
      const endTime = new Date(flashSaleProducts[0]?.flash_sales?.end_date);
      const difference = endTime.getTime() - now.getTime();

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [flashSaleProducts]);

  const handleAddToCart = (product: Product, flashSaleItem: FlashSaleItem) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to cart',
        variant: 'destructive'
      });
      return;
    }

    addItem({ 
      ...product, 
      selling_price: flashSaleItem.sale_price 
    });
    
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart`
    });
  };

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  if (flashSaleProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full animate-ping"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Fire className="h-8 w-8 text-white animate-pulse" />
            <h2 className="text-3xl font-bold text-white">Flash Sale</h2>
            <Zap className="h-8 w-8 text-white animate-pulse" />
          </div>
          
          {/* Countdown Timer */}
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 inline-block">
            <div className="flex items-center gap-4 text-white">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Berakhir dalam:</span>
              <div className="flex gap-2">
                <div className="bg-white/30 px-3 py-1 rounded text-sm font-bold">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </div>
                <div className="bg-white/30 px-3 py-1 rounded text-sm font-bold">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </div>
                <div className="bg-white/30 px-3 py-1 rounded text-sm font-bold">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {flashSaleProducts.map((item) => (
            <Card 
              key={item.id} 
              className="group hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden bg-white transform hover:scale-105"
              onClick={() => item.products && handleProductClick(item.products)}
            >
              <div className="relative">
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={item.products?.image_url || '/placeholder.svg'}
                    alt={item.products?.name || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                
                {/* Discount Badge */}
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  -{Math.round(item.discount_percentage)}%
                </div>
                
                {/* Flash Sale Badge */}
                <div className="absolute top-2 right-2 bg-yellow-400 text-red-600 text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                  ⚡ FLASH
                </div>
                
                {/* Stock Progress */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                  <div className="text-xs mb-1">Terjual: {item.sold_quantity}/{item.sold_quantity + item.stock_quantity}</div>
                  <div className="w-full bg-gray-300 rounded-full h-1">
                    <div 
                      className="bg-yellow-400 h-1 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(item.sold_quantity / (item.sold_quantity + item.stock_quantity)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-3">
                <h3 className="font-medium text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                  {item.products?.name || 'Unnamed Product'}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-red-600">
                      Rp {item.sale_price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 line-through">
                      Rp {item.original_price.toLocaleString('id-ID')}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-gray-600">4.5</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-orange-600 font-medium">
                    Sisa {item.stock_quantity} pcs
                  </div>
                  
                  <Button
                    size="sm"
                    className="w-full text-xs h-8 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.products) {
                        handleAddToCart(item.products, item);
                      }
                    }}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Beli Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Call to Action */}
        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            className="bg-white/20 backdrop-blur-sm border-white text-white hover:bg-white hover:text-red-500 transition-all duration-300"
          >
            Lihat Semua Flash Sale
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HomeFlashSale;
