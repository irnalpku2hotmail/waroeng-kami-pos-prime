
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Package, ShoppingCart, Zap } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from '@/components/CountdownTimer';

interface FlashSale {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  flash_sale_items: Array<{
    id: string;
    original_price: number;
    sale_price: number;
    discount_percentage: number;
    stock_quantity: number;
    sold_quantity: number;
    max_quantity_per_customer: number;
    products: {
      id: string;
      name: string;
      image_url: string;
      current_stock: number;
    };
  }>;
}

interface EnhancedFlashSaleProps {
  flashSales: FlashSale[];
}

const EnhancedFlashSale = ({ flashSales }: EnhancedFlashSaleProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    addToCart({
      id: item.products.id,
      name: item.products.name,
      price: item.sale_price,
      quantity: 1,
      image: item.products.image_url,
      stock: item.stock_quantity,
      flashSalePrice: item.sale_price,
      isFlashSale: true,
      product_id: item.products.id,
      unit_price: item.sale_price,
      total_price: item.sale_price * 1,
      product: {
        id: item.products.id,
        name: item.products.name,
        image_url: item.products.image_url
      }
    });

    toast({
      title: 'Berhasil!',
      description: `${item.products.name} telah ditambahkan ke keranjang`,
    });
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  if (!flashSales || flashSales.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {flashSales.map((flashSale) => (
        <Card key={flashSale.id} className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <div className="p-2 bg-red-500 rounded-full">
                  <Zap className="h-5 w-5 text-white fill-current" />
                </div>
                {flashSale.name}
              </CardTitle>
              <CountdownTimer endDate={flashSale.end_date} />
            </div>
            {flashSale.description && (
              <p className="text-red-700 text-sm">{flashSale.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {flashSale.flash_sale_items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleProductClick(item.products.id)}
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 relative">
                    {item.products.image_url ? (
                      <img 
                        src={item.products.image_url} 
                        alt={item.products.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                      -{item.discount_percentage}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm line-clamp-2 h-10">
                      {item.products.name}
                    </h3>
                    
                    <div className="space-y-1">
                      <p className="text-red-600 font-bold text-sm">
                        {formatPrice(item.sale_price)}
                      </p>
                      <p className="text-gray-400 text-xs line-through">
                        {formatPrice(item.original_price)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Tersisa: {item.stock_quantity - item.sold_quantity}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={(e) => handleAddToCart(item, e)}
                        disabled={item.stock_quantity <= item.sold_quantity}
                        className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600"
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EnhancedFlashSale;
