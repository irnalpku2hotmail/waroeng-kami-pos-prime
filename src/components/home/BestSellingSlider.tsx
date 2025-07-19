
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRef } from 'react';

const BestSellingSlider = () => {
  const { addToCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: bestSelling = [], isLoading } = useQuery({
    queryKey: ['best-selling-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          product_id,
          quantity,
          products (
            id,
            name,
            image_url,
            selling_price,
            current_stock,
            categories (name)
          )
        `)
        .not('products', 'is', null);

      if (error) throw error;

      // Filter out items with null products and group by product
      const validData = data.filter(item => item.products !== null);
      
      const productSales = validData.reduce((acc: any, item) => {
        const productId = item.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            product: item.products,
            totalSold: 0
          };
        }
        acc[productId].totalSold += item.quantity;
        return acc;
      }, {});

      // Convert to array and sort by total sold
      const bestSellingArray = Object.values(productSales)
        .sort((a: any, b: any) => b.totalSold - a.totalSold)
        .slice(0, 10);

      return bestSellingArray;
    }
  });

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (item: any) => {
    if (!item.product) return;
    
    addToCart({
      id: item.product.id,
      product_id: item.product.id,
      name: item.product.name,
      price: item.product.selling_price,
      unit_price: item.product.selling_price,
      total_price: item.product.selling_price,
      quantity: 1,
      image: item.product.image_url,
      stock: item.product.current_stock || 0,
      product: {
        id: item.product.id,
        name: item.product.name,
        image_url: item.product.image_url
      }
    });

    toast({
      title: 'Produk ditambahkan',
      description: `${item.product.name} telah ditambahkan ke keranjang`,
    });
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Produk Terlaris</h2>
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-none w-48 animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (bestSelling.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Produk Terlaris</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={scrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={scrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {bestSelling.map((item: any, index) => {
          // Additional safety check
          if (!item.product) return null;
          
          return (
            <Card 
              key={item.product?.id} 
              className="flex-none w-48 cursor-pointer hover:shadow-lg transition-shadow duration-200 group relative"
            >
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                  #{index + 1}
                </Badge>
              </div>
              
              <CardContent className="p-4">
                <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100 relative">
                  <img
                    src={item.product?.image_url || '/placeholder.svg'}
                    alt={item.product?.name || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {(item.product?.current_stock || 0) <= 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">
                        Habis
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                    {item.product?.name}
                  </h3>
                  
                  {item.product?.categories && (
                    <Badge variant="secondary" className="text-xs">
                      {item.product.categories.name}
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-600 text-sm">
                        Rp {item.product?.selling_price?.toLocaleString('id-ID') || '0'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Terjual: {item.totalSold}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      className="h-8 w-8 p-0"
                      disabled={(item.product?.current_stock || 0) <= 0}
                    >
                      <ShoppingCart className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BestSellingSlider;
