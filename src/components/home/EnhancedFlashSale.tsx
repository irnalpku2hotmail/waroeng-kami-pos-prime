
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Clock, Package } from 'lucide-react';
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
  flash_sale_items: FlashSaleItem[];
}

interface FlashSaleItem {
  id: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  stock_quantity: number;
  sold_quantity: number;
  products: {
    id: string;
    name: string;
    image_url: string;
  };
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

  const handleAddToCart = (item: FlashSaleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    addToCart({
      id: item.products.id,
      name: item.products.name,
      price: item.sale_price,
      image: item.products.image_url,
      quantity: 1,
      stock: item.stock_quantity,
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

  if (!flashSales || flashSales.length === 0) return null;

  return (
    <div className="mb-8">
      {flashSales.map((flashSale) => (
        <Card key={flashSale.id} className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-red-600 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {flashSale.name}
              </CardTitle>
              <CountdownTimer endDate={flashSale.end_date} />
            </div>
            {flashSale.description && (
              <p className="text-gray-600 text-sm">{flashSale.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {flashSale.flash_sale_items.map((item) => (
                <Card 
                  key={item.id} 
                  className="group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProductClick(item.products.id)}
                >
                  <CardContent className="p-2">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
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
                    </div>
                    
                    <div className="space-y-1">
                      <Badge variant="destructive" className="text-xs">
                        -{item.discount_percentage}%
                      </Badge>
                      
                      <h3 className="font-medium text-xs line-clamp-2 h-8">
                        {item.products.name}
                      </h3>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-red-600">
                          {formatPrice(item.sale_price)}
                        </p>
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice(item.original_price)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          {item.stock_quantity - item.sold_quantity} tersisa
                        </span>
                        
                        <Button
                          size="sm"
                          onClick={(e) => handleAddToCart(item, e)}
                          disabled={item.stock_quantity <= item.sold_quantity}
                          className="h-6 w-6 p-0"
                        >
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EnhancedFlashSale;
