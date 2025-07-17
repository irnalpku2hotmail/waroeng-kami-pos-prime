import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ShoppingCart, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCartWithShipping } from '@/hooks/useCartWithShipping';
import { toast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';

const EnhancedFlashSale = () => {
  const { addItem } = useCartWithShipping();

  const { data: flashSales, isLoading } = useQuery({
    queryKey: ['active-flash-sales'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items(
            *,
            products(*)
          )
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item.stock_quantity < 1) {
      toast({
        title: 'Stok habis',
        description: 'Produk ini sudah habis',
        variant: 'destructive'
      });
      return;
    }

    addItem({
      id: item.products.id,
      name: item.products.name,
      price: item.sale_price,
      image: item.products.image_url || '/placeholder.svg',
      quantity: 1,
      stock: item.stock_quantity
    });

    toast({
      title: 'Berhasil ditambahkan',
      description: `${item.products.name} telah ditambahkan ke keranjang`
    });
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-3 rounded-lg animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!flashSales || flashSales.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {flashSales.map((sale) => (
        <div key={sale.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-red-600">
                  {sale.name}
                </h2>
              </div>
              <Badge variant="destructive" className="animate-pulse">
                Flash Sale
              </Badge>
            </div>
            <CountdownTimer endDate={sale.end_date} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sale.flash_sale_items?.slice(0, 6).map((item: any) => (
              <Link key={item.id} to={`/product/${item.products.id}`}>
                <Card className="group hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                  <CardContent className="p-3">
                    <div className="relative">
                      <div className="aspect-square mb-2 overflow-hidden rounded-lg">
                        <img
                          src={item.products.image_url || '/placeholder.svg'}
                          alt={item.products.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <Badge className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 py-0.5">
                        -{item.discount_percentage}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                        {item.products.name}
                      </h3>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-red-600">
                            Rp {item.sale_price.toLocaleString('id-ID')}
                          </div>
                          <div className="text-xs text-gray-500 line-through">
                            Rp {item.original_price.toLocaleString('id-ID')}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {item.stock_quantity} tersisa
                          </Badge>
                          <Button
                            size="sm"
                            className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700"
                            onClick={(e) => handleAddToCart(item, e)}
                            disabled={item.stock_quantity < 1}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Beli
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EnhancedFlashSale;
