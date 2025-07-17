
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Package, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';
import { useRef } from 'react';

interface FlashSaleItem {
  id: string;
  flash_sale_id: string;
  product_id: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  stock_quantity: number;
  sold_quantity: number;
  max_quantity_per_customer: number | null;
  created_at: string;
  products: {
    id: string;
    name: string;
    image_url: string | null;
    current_stock: number;
    description: string | null;
  };
}

interface FlashSale {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  flash_sale_items: FlashSaleItem[];
}

interface EnhancedFlashSaleProps {
  flashSales: FlashSale[];
}

const EnhancedFlashSale = ({ flashSales }: EnhancedFlashSaleProps) => {
  const { addToCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

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

  const handleAddToCart = (item: FlashSaleItem) => {
    addToCart({
      id: item.product_id,
      product_id: item.product_id,
      name: item.products.name,
      price: item.sale_price,
      unit_price: item.sale_price,
      total_price: item.sale_price,
      quantity: 1,
      image: item.products.image_url || undefined,
      stock: item.stock_quantity,
      flashSalePrice: item.sale_price,
      isFlashSale: true,
      product: {
        id: item.product_id,
        name: item.products.name,
        image_url: item.products.image_url
      }
    });

    toast({
      title: 'Berhasil!',
      description: `${item.products.name} telah ditambahkan ke keranjang`,
    });
  };

  if (!flashSales || flashSales.length === 0) {
    return null;
  }

  const activeFlashSale = flashSales[0];

  return (
    <div className="mb-8">
      {/* Flash Sale Header */}
      <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <Zap className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">{activeFlashSale.name}</h2>
                <p className="text-red-100 text-lg">{activeFlashSale.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-red-100 mb-2">Berakhir dalam:</p>
              <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <CountdownTimer endDate={activeFlashSale.end_date} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-20">
          <Zap className="h-16 w-16 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <Zap className="h-24 w-24 text-white" />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Produk Flash Sale</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={scrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={scrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Products Slider */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {activeFlashSale.flash_sale_items.map((item) => (
          <Card key={item.id} className="flex-none w-64 group hover:shadow-xl transition-all duration-300 border-2 border-red-100 hover:border-red-300">
            <CardContent className="p-4">
              <div className="relative mb-4">
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  {item.products.image_url ? (
                    <img 
                      src={item.products.image_url} 
                      alt={item.products.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1">
                    -{item.discount_percentage}%
                  </Badge>
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    FLASH
                  </Badge>
                </div>
              </div>
              
              <h3 className="font-bold text-lg mb-3 line-clamp-2 leading-tight">
                {item.products.name}
              </h3>
              
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-red-600">
                    {formatPrice(item.sale_price)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(item.original_price)}
                  </span>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Hemat {formatPrice(item.original_price - item.sale_price)}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Terjual: {item.sold_quantity}</span>
                  <span>Sisa: {item.stock_quantity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((item.sold_quantity / (item.sold_quantity + item.stock_quantity)) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <Button
                onClick={() => handleAddToCart(item)}
                disabled={item.stock_quantity === 0}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                {item.stock_quantity === 0 ? (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Habis
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Beli Sekarang
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EnhancedFlashSale;
