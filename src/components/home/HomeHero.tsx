
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Star, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface HomeHeroProps {
  storeName: string;
  storeDescription?: string;
  onProductClick: (product: any) => void;
}

const HomeHero = ({ storeName, storeDescription, onProductClick }: HomeHeroProps) => {
  const { user } = useAuth();
  const { addItem } = useCart();

  // Fetch featured/flash sale products
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
        .limit(4);

      if (error) throw error;
      return data || [];
    }
  });

  const handleAddToCart = (product: any, flashSaleItem?: any) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to cart',
        variant: 'destructive'
      });
      return;
    }

    const price = flashSaleItem ? flashSaleItem.sale_price : product.selling_price;
    addItem({ ...product, selling_price: price });
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart`
    });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to {storeName}
          </h1>
          {storeDescription && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {storeDescription}
            </p>
          )}
        </div>

        {/* Flash Sale Section */}
        {flashSaleProducts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-full">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Flash Sale</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flashSaleProducts.map((item) => (
                <Card 
                  key={item.id} 
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => onProductClick(item.products)}
                >
                  <div className="relative">
                    <img
                      src={item.products.image_url || '/placeholder.svg'}
                      alt={item.products.name}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                      -{item.discount_percentage}%
                    </Badge>
                  </div>
                  
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">
                      {item.products.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-red-600">
                        Rp {item.sale_price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        Rp {item.original_price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Stock: {item.stock_quantity}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>4.5</span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item.products, item);
                      }}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add to Cart
                    </Button>
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

export default HomeHero;
