
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Package, Zap } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import CountdownTimer from '@/components/CountdownTimer';

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
  } | null;
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

interface HomeFlashSaleProps {
  flashSales: FlashSale[];
}

const HomeFlashSale = ({ flashSales }: HomeFlashSaleProps) => {
  const { addToCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (item: FlashSaleItem) => {
    if (!item.products) {
      toast({
        title: 'Error',
        description: 'Produk tidak tersedia',
        variant: 'destructive',
      });
      return;
    }

    addToCart({
      id: item.product_id,
      name: item.products.name,
      price: item.sale_price,
      quantity: 1,
      image: item.products.image_url || undefined,
      stock: item.stock_quantity,
      flashSalePrice: item.sale_price,
      isFlashSale: true,
      product_id: item.product_id,
      unit_price: item.sale_price,
      total_price: item.sale_price * 1,
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

  // Filter out null/invalid flash sales and items
  const validFlashSales = flashSales?.filter(sale => 
    sale && 
    typeof sale === 'object' && 
    sale.id && 
    sale.name &&
    Array.isArray(sale.flash_sale_items)
  ) || [];

  if (!validFlashSales || validFlashSales.length === 0) {
    return null;
  }

  const activeFlashSale = validFlashSales[0]; // Get the first active flash sale

  // Filter valid flash sale items
  const validFlashSaleItems = activeFlashSale.flash_sale_items?.filter(item => 
    item && 
    typeof item === 'object' && 
    item.id && 
    item.products &&
    typeof item.products === 'object' &&
    item.products.name
  ) || [];

  if (validFlashSaleItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{activeFlashSale.name}</h2>
              <p className="text-red-100">{activeFlashSale.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-red-100 mb-1">Berakhir dalam:</p>
            <CountdownTimer endDate={activeFlashSale.end_date} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {validFlashSaleItems.map((item) => (
          <Card key={item.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="relative mb-3">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {item.products?.image_url ? (
                    <img 
                      src={item.products.image_url} 
                      alt={item.products.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                  -{item.discount_percentage}%
                </Badge>
              </div>
              
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                {item.products?.name || 'Unnamed Product'}
              </h3>
              
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-600">
                    {formatPrice(item.sale_price)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(item.original_price)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>Stok: {item.stock_quantity}</span>
                <span>Terjual: {item.sold_quantity}</span>
              </div>
              
              <Button
                onClick={() => handleAddToCart(item)}
                disabled={item.stock_quantity === 0 || !item.products}
                className="w-full"
                size="sm"
              >
                {item.stock_quantity === 0 ? 'Habis' : 'Tambah ke Keranjang'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HomeFlashSale;
