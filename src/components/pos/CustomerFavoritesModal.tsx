import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomerFavoritesModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string | null;
  onAddToCart: (product: any) => void;
}

const CustomerFavoritesModal = ({ open, onClose, customerId, onAddToCart }: CustomerFavoritesModalProps) => {
  // Fetch customer's most purchased products
  const { data: favoriteProducts = [], isLoading } = useQuery({
    queryKey: ['customer-favorites', customerId],
    queryFn: async () => {
      if (!customerId) return [];

      // Get transaction items with product details for this customer
      const { data: items, error } = await supabase
        .from('transaction_items')
        .select(`
          product_id,
          quantity,
          transaction_id,
          products!inner (
            id,
            name,
            selling_price,
            current_stock,
            image_url,
            units (name, abbreviation)
          ),
          transactions!inner (
            customer_id
          )
        `)
        .eq('transactions.customer_id', customerId);

      if (error) throw error;
      if (!items || items.length === 0) return [];

      // Aggregate by product
      const productMap = new Map();
      items.forEach((item: any) => {
        if (item.products) {
          const productId = item.product_id;
          if (productMap.has(productId)) {
            productMap.get(productId).total_quantity += item.quantity;
            productMap.get(productId).purchase_count += 1;
          } else {
            productMap.set(productId, {
              ...item.products,
              total_quantity: item.quantity,
              purchase_count: 1
            });
          }
        }
      });

      // Convert to array and sort by purchase count
      return Array.from(productMap.values())
        .sort((a, b) => b.purchase_count - a.purchase_count)
        .slice(0, 10);
    },
    enabled: !!customerId && open
  });

  const handleAddToCart = (product: any) => {
    if (product.current_stock < 1) {
      toast({
        title: 'Stok Habis',
        description: 'Produk tidak tersedia',
        variant: 'destructive'
      });
      return;
    }

    onAddToCart(product);
    toast({
      title: 'Ditambahkan ke Keranjang',
      description: `${product.name} ditambahkan ke keranjang`
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Favorit Pelanggan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Memuat data...
            </div>
          ) : !customerId ? (
            <div className="text-center py-8 text-gray-500">
              Pilih pelanggan terlebih dahulu
            </div>
          ) : favoriteProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Pelanggan belum pernah melakukan transaksi
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favoriteProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 flex-shrink-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 truncate">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-blue-600 mb-2">
                        {formatPrice(product.selling_price)}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {product.purchase_count}x dibeli
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Stok: {product.current_stock}
                        </Badge>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.current_stock < 1}
                        className="w-full"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Tambah
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFavoritesModal;
