
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Clock, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';

interface FlashSaleItem {
  id: string;
  product_id: string;
  original_price: number;
  sale_price: number;
  discount_percentage: number;
  stock_quantity: number;
  sold_quantity: number;
  products: {
    id: string;
    name: string;
    image_url?: string;
  } | null;
}

interface FlashSale {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  flash_sale_items: FlashSaleItem[];
}

interface EnhancedFlashSaleProps {
  flashSales: FlashSale[];
}

const EnhancedFlashSale = ({ flashSales }: EnhancedFlashSaleProps) => {
  const { addToCart } = useCart();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const handleAddToCart = (e: React.MouseEvent, item: FlashSaleItem) => {
    e.stopPropagation();
    
    const product = item.products;
    if (!product) {
      toast({
        title: 'Error',
        description: 'Product information not available',
        variant: 'destructive'
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: item.sale_price,
      quantity: 1,
      image: product.image_url,
      stock: item.stock_quantity - item.sold_quantity,
      flashSalePrice: item.sale_price,
      isFlashSale: true,
      product_id: product.id,
      unit_price: item.sale_price,
      total_price: item.sale_price,
      product: {
        id: product.id,
        name: product.name,
        image_url: product.image_url
      }
    });

    toast({
      title: 'Ditambahkan ke keranjang!',
      description: `${product.name} berhasil ditambahkan dengan harga flash sale`,
    });
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    if (flashSales.length > 0) {
      const timer = setInterval(() => {
        const now = new Date();
        const endDate = new Date(flashSales[0].end_date);
        const difference = endDate.getTime() - now.getTime();

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeLeft({ hours, minutes, seconds });
        } else {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [flashSales]);

  if (flashSales.length === 0) return null;

  const currentSale = flashSales[0];
  const saleItems = currentSale.flash_sale_items || [];

  return (
    <div className="mb-8 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-3xl p-6 border border-red-100">
      {/* Flash Sale Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Flame className="h-10 w-10 text-red-500 animate-pulse" />
          <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            FLASH SALE
          </h2>
          <Flame className="h-10 w-10 text-red-500 animate-pulse" />
        </div>
        <p className="text-gray-700 mb-4 text-lg font-medium">{currentSale.name}</p>
        
        {/* Countdown Timer */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Clock className="h-6 w-6 text-red-500" />
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-b from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-lg">
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <span className="text-red-500 font-bold text-xl">:</span>
            <div className="bg-gradient-to-b from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-lg">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </div>
            <span className="text-red-500 font-bold text-xl">:</span>
            <div className="bg-gradient-to-b from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-lg">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">Jam : Menit : Detik</p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Produk Flash Sale</h3>
        
        <div className="flex gap-2">
          {showLeftButton && (
            <button
              onClick={scrollLeft}
              className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-red-200"
            >
              <ChevronLeft className="h-5 w-5 text-red-600" />
            </button>
          )}
          
          {showRightButton && (
            <button
              onClick={scrollRight}
              className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors border border-red-200"
            >
              <ChevronRight className="h-5 w-5 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {/* Flash Sale Products Slider */}
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {saleItems.map((item) => {
          const product = item.products;
          
          // Skip items without valid product data
          if (!product) {
            return null;
          }

          const discountPercent = Math.round(item.discount_percentage);
          const originalPrice = item.original_price;
          const salePrice = item.sale_price;
          const soldPercent = Math.min((item.sold_quantity / item.stock_quantity) * 100, 100);

          return (
            <Card 
              key={item.id} 
              className="flex-none w-80 hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-red-200 hover:border-red-400 bg-white/80 backdrop-blur-sm rounded-2xl group overflow-hidden"
            >
              <div className="relative">
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 text-sm font-bold">
                  -{discountPercent}%
                </Badge>
                
                {item.stock_quantity - item.sold_quantity <= 5 && (
                  <Badge className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1 animate-pulse">
                    Stok Terbatas!
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-5">
                <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-800 group-hover:text-red-600 transition-colors">
                  {product.name || 'Unnamed Product'}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-red-600">
                      Rp {salePrice.toLocaleString('id-ID')}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      Rp {originalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Terjual {item.sold_quantity}</span>
                      <span>Tersisa {item.stock_quantity - item.sold_quantity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500 relative"
                        style={{ width: `${soldPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={(e) => handleAddToCart(e, item)}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Beli Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedFlashSale;
