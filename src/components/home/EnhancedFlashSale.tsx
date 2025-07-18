
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, ShoppingCart, Fire, Star, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';

interface EnhancedFlashSaleProps {
  flashSales: any[];
}

const EnhancedFlashSale = ({ flashSales }: EnhancedFlashSaleProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const { addToCart } = useCart();

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

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const product = item.products;
    addToCart({
      id: product.id,
      name: product.name,
      price: item.sale_price,
      quantity: 1,
      image: product.image_url,
      stock: item.stock_quantity - item.sold_quantity,
      isFlashSale: true,
      flashSalePrice: item.sale_price,
      product_id: product.id,
      unit_price: item.sale_price,
      total_price: item.sale_price * 1,
      product: {
        id: product.id,
        name: product.name,
        image_url: product.image_url
      }
    });

    toast({
      title: 'Berhasil!',
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  if (flashSales.length === 0) return null;

  const currentSale = flashSales[0];
  const saleItems = currentSale.flash_sale_items || [];

  return (
    <div className="mb-8">
      {/* Flash Sale Header with Stunning Design */}
      <div className="bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 rounded-3xl p-8 shadow-2xl border-4 border-white/20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
          }}></div>
        </div>
        
        <div className="relative z-10">
          {/* Flash Sale Title */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="relative">
                <Fire className="h-12 w-12 text-yellow-300 animate-pulse" />
                <div className="absolute inset-0 bg-yellow-300/30 rounded-full animate-ping"></div>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-wide">
                FLASH SALE
              </h2>
              <div className="relative">
                <Zap className="h-12 w-12 text-yellow-300 animate-pulse" />
                <div className="absolute inset-0 bg-yellow-300/30 rounded-full animate-ping"></div>
              </div>
            </div>
            <p className="text-white/90 text-lg font-semibold bg-black/20 rounded-full px-6 py-2 inline-block">
              {currentSale.name}
            </p>
          </div>
          
          {/* Countdown Timer with Enhanced Design */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-3 bg-black/30 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <Timer className="h-6 w-6 text-yellow-300" />
              <span className="text-white font-bold text-lg">Berakhir dalam:</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-3xl font-black text-white text-center">
                  {timeLeft.hours.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-white/80 font-semibold text-center mt-1">JAM</div>
              </div>
              <div className="text-white text-2xl font-bold animate-pulse">:</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-3xl font-black text-white text-center">
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-white/80 font-semibold text-center mt-1">MENIT</div>
              </div>
              <div className="text-white text-2xl font-bold animate-pulse">:</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-3xl font-black text-white text-center">
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-white/80 font-semibold text-center mt-1">DETIK</div>
              </div>
            </div>
          </div>

          {/* Special Offer Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-red-600 px-6 py-2 rounded-full font-black text-sm shadow-lg">
              <Star className="h-4 w-4" />
              DISKON HINGGA 70%
              <Star className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Flash Sale Products Grid */}
      <div className="mt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {saleItems.slice(0, 12).map((item) => {
            const product = item.products;
            const discountPercent = Math.round(item.discount_percentage);
            const originalPrice = item.original_price;
            const salePrice = item.sale_price;
            const soldPercent = Math.min((item.sold_quantity / item.stock_quantity) * 100, 100);
            const remainingStock = item.stock_quantity - item.sold_quantity;

            return (
              <Card 
                key={item.id} 
                className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-red-200 rounded-2xl bg-white"
              >
                <div className="relative">
                  <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-2xl">
                    <img
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  
                  {/* Discount Badge */}
                  <Badge className="absolute top-3 left-3 bg-red-500 text-white font-black px-2 py-1 rounded-xl shadow-lg">
                    -{discountPercent}%
                  </Badge>
                  
                  {/* Stock Alert */}
                  {remainingStock <= 5 && remainingStock > 0 && (
                    <Badge className="absolute top-3 right-3 bg-orange-500 text-white font-bold text-xs px-2 py-1 rounded-xl shadow-lg animate-pulse">
                      Sisa {remainingStock}
                    </Badge>
                  )}

                  {/* Sold Out Overlay */}
                  {remainingStock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-2xl">
                      <span className="text-white font-bold text-lg bg-red-600 px-4 py-2 rounded-xl">HABIS</span>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm line-clamp-2 mb-2 text-gray-800 group-hover:text-red-600 transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Price Section */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-red-600">
                          Rp {salePrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 line-through">
                          Rp {originalPrice.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                          Hemat {((originalPrice - salePrice) / originalPrice * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span className="font-semibold">Terjual {item.sold_quantity}</span>
                        <span>Target {item.stock_quantity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500 relative"
                          style={{ width: `${soldPercent}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Buy Button */}
                    <Button 
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                      size="sm"
                      disabled={remainingStock === 0}
                      onClick={(e) => handleAddToCart(item, e)}
                    >
                      {remainingStock === 0 ? (
                        'Habis'
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Beli Sekarang
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnhancedFlashSale;
