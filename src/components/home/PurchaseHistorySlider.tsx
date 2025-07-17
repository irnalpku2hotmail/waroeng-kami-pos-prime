
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRef } from 'react';

const PurchaseHistorySlider = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: purchaseHistory = [], isLoading } = useQuery({
    queryKey: ['user-purchase-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          products (
            id,
            name,
            image_url,
            selling_price,
            current_stock,
            categories (name)
          ),
          transactions!inner (
            customer_id,
            created_at
          )
        `)
        .eq('transactions.customer_id', user.id)
        .not('products', 'is', null)
        .order('transactions.created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Filter out items with null products and remove duplicates
      const validData = data?.filter(item => item.products !== null) || [];
      const uniqueProducts = validData.reduce((acc: any[], item) => {
        if (!acc.find(p => p.products?.id === item.products?.id)) {
          acc.push(item);
        }
        return acc;
      }, []);

      return uniqueProducts;
    },
    enabled: !!user?.id
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
    if (!item.products) return;
    
    addToCart({
      id: item.products.id,
      product_id: item.products.id,
      name: item.products.name,
      price: item.products.selling_price,
      unit_price: item.products.selling_price,
      total_price: item.products.selling_price,
      quantity: 1,
      image: item.products.image_url,
      stock: item.products.current_stock || 0,
      product: {
        id: item.products.id,
        name: item.products.name,
        image_url: item.products.image_url
      }
    });

    toast({
      title: 'Produk ditambahkan',
      description: `${item.products.name} telah ditambahkan ke keranjang`,
    });
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Beli Lagi</h2>
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

  if (purchaseHistory.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Beli Lagi</h2>
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
        {purchaseHistory.map((item) => {
          // Additional safety check
          if (!item.products) return null;
          
          return (
            <Card 
              key={item.products?.id} 
              className="flex-none w-48 cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
            >
              <CardContent className="p-4">
                <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100 relative">
                  <img
                    src={item.products?.image_url || '/placeholder.svg'}
                    alt={item.products?.name || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {(item.products?.current_stock || 0) <= 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">
                        Habis
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                    {item.products?.name}
                  </h3>
                  
                  {item.products?.categories && (
                    <Badge variant="secondary" className="text-xs">
                      {item.products.categories.name}
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-600 text-sm">
                        Rp {item.products?.selling_price?.toLocaleString('id-ID') || '0'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Stok: {item.products?.current_stock || 0}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      className="h-8 w-8 p-0"
                      disabled={(item.products?.current_stock || 0) <= 0}
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

export default PurchaseHistorySlider;
