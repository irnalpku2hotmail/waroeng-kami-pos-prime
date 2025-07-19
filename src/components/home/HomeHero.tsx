
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

interface HomeHeroProps {
  storeName?: string;
  storeDescription?: string;
  onProductClick?: (product: Product) => void;
}

const HomeHero = ({ storeName = 'Waroeng Kami', storeDescription, onProductClick }: HomeHeroProps) => {
  const { user } = useAuth();
  const { addItem } = useCart();

  // Fetch featured/flash sale products
  const { data: flashSaleProducts = [] } = useQuery({
    queryKey: ['flash-sale-products'],
    queryFn: async () => {
      const now = new Date().toISOString();
      console.log('Fetching flash sale products...');
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

      if (error) {
        console.error('Error fetching flash sale products:', error);
        throw error;
      }
      
      console.log('Flash sale products data:', data);
      return (data || []) as FlashSaleItem[];
    }
  });

  const handleAddToCart = (product: Product, flashSaleItem?: FlashSaleItem) => {
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
      description: `${String(product.name || 'Product')} has been added to your cart`
    });
  };

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to {String(storeName || 'Waroeng Kami')}
          </h1>
          {storeDescription && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {String(storeDescription)}
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
                  onClick={() => item.products && handleProductClick(item.products)}
                >
                  <div className="relative">
                    <img
                      src={item.products?.image_url || '/placeholder.svg'}
                      alt={String(item.products?.name || 'Product')}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                      -{item.discount_percentage || 0}%
                    </Badge>
                  </div>
                  
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">
                      {String(item.products?.name || 'Unnamed Product')}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-red-600">
                        Rp {(item.sale_price || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        Rp {(item.original_price || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Stock: {item.stock_quantity || 0}</span>
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
                        if (item.products) {
                          handleAddToCart(item.products, item);
                        }
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
