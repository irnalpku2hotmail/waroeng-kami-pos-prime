
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endDate]);

  function calculateTimeLeft() {
    const difference = new Date(endDate).getTime() - new Date().getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }

  return (
    <div className="flex items-center space-x-1 text-xs">
      <span>{timeLeft.days} Hari</span>
      <span>{timeLeft.hours} Jam</span>
      <span>{timeLeft.minutes} Menit</span>
      <span>{timeLeft.seconds} Detik</span>
    </div>
  );
};

const CompactFlashSale = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const { data: flashSaleData, isLoading, error } = useQuery({
    queryKey: ['active-flash-sale-with-items'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // First get active flash sale
      const { data: flashSale, error: fsError } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .single();

      if (fsError || !flashSale) {
        console.error("No active flash sale found:", fsError);
        return null;
      }

      // Then get flash sale items with products
      const { data: flashSaleItems, error: fsiError } = await supabase
        .from('flash_sale_items')
        .select(`
          *,
          products (*)
        `)
        .eq('flash_sale_id', flashSale.id)
        .gt('stock_quantity', 0)
        .limit(1)
        .single();

      if (fsiError || !flashSaleItems) {
        console.error("No flash sale items found:", fsiError);
        return null;
      }

      return {
        flashSale,
        flashSaleItem: flashSaleItems,
        product: flashSaleItems.products
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-gray-700 animate-pulse">
              Loading Flash Sale...
            </h3>
          </div>
          <div className="bg-gray-200 h-20 rounded animate-pulse"></div>
          <div className="bg-gray-200 h-4 rounded animate-pulse"></div>
          <div className="bg-gray-200 h-4 rounded animate-pulse w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !flashSaleData || !flashSaleData.product) {
    return null;
  }

  const { flashSale, flashSaleItem, product } = flashSaleData;

  const handleAddToCart = (product: any) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to cart',
        variant: 'destructive'
      });
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: flashSaleItem.sale_price,
      quantity: 1,
      image: product.image_url,
      stock: product.current_stock,
      flashSalePrice: flashSaleItem.sale_price,
      isFlashSale: true,
      product_id: product.id,
      unit_price: flashSaleItem.sale_price,
      total_price: flashSaleItem.sale_price * 1
    };

    addToCart(cartItem);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart`
    });
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-700">
            Flash Sale Berakhir dalam:
          </h3>
          <CountdownTimer endDate={flashSale.end_date} />
        </div>
        <div className="relative">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-40 object-cover rounded-md"
          />
          <Badge className="absolute top-1 right-1 text-xs">
            -{Math.round(((flashSaleItem.original_price - flashSaleItem.sale_price) / flashSaleItem.original_price) * 100)}%
          </Badge>
        </div>
        <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
          {product.name}
        </h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600">
              {formatPrice(flashSaleItem.sale_price)}
            </p>
            <p className="text-xs text-gray-500 line-through">
              {formatPrice(flashSaleItem.original_price)}
            </p>
          </div>
          <Button size="sm" onClick={() => handleAddToCart(product)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Beli
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactFlashSale;
