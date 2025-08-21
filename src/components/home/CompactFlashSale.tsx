
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Zap, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const CompactFlashSale = () => {
  const navigate = useNavigate();

  const { data: flashSaleData, isLoading } = useQuery({
    queryKey: ['active-flash-sales-compact'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items (
            *,
            products (
              *,
              categories (name)
            )
          )
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTimeLeft = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Berakhir';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}h ${hours}j`;
    if (hours > 0) return `${hours}j ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading || !flashSaleData || !flashSaleData.flash_sale_items?.length) {
    return null;
  }

  return (
    <div className="mb-6">
      <Card className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              {flashSaleData.name}
            </CardTitle>
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimeLeft(flashSaleData.end_date)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {flashSaleData.flash_sale_items.map((item: any) => (
                <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6">
                  <Card className="bg-white text-gray-900 h-full">
                    <CardContent className="p-3">
                      <div className="relative mb-2">
                        <img
                          src={item.products.image_url || '/placeholder.svg'}
                          alt={item.products.name}
                          className="w-full h-16 object-cover rounded-md"
                        />
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs">
                          -{Math.round(item.discount_percentage)}%
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-xs line-clamp-2 mb-1">
                        {item.products.name}
                      </h4>
                      
                      <div className="space-y-1">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-red-600">
                            {formatPrice(item.sale_price)}
                          </span>
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(item.original_price)}
                          </span>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-6 text-xs"
                          onClick={() => navigate(`/product/${item.products.id}`)}
                        >
                          <Eye className="h-2 w-2 mr-1" />
                          Lihat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 h-8 w-8 bg-white/80 border-0" />
            <CarouselNext className="right-2 h-8 w-8 bg-white/80 border-0" />
          </Carousel>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompactFlashSale;
