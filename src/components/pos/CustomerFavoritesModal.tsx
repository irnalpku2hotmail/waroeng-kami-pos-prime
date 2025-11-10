import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, TrendingUp, Receipt } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomerFavoritesModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string | null;
  onAddToCart: (product: any) => void;
}

const CustomerFavoritesModal = ({ open, onClose, customerId, onAddToCart }: CustomerFavoritesModalProps) => {
  // Fetch customer transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['customer-transactions', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (
            *,
            products (
              name,
              selling_price
            )
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId && open,
  });

  // Fetch favorite products
  const { data: favoriteProducts, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['customer-favorites', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          product_id,
          quantity,
          products (
            id,
            name,
            selling_price,
            current_stock,
            image_url
          ),
          transactions!inner (
            customer_id
          )
        `)
        .eq('transactions.customer_id', customerId);

      if (error) throw error;

      // Aggregate by product
      const productMap = new Map();
      data.forEach((item: any) => {
        const productId = item.product_id;
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            ...item.products,
            purchase_count: 0,
            total_quantity: 0,
          });
        }
        const product = productMap.get(productId);
        product.purchase_count += 1;
        product.total_quantity += item.quantity;
      });

      const aggregatedData = Array.from(productMap.values())
        .sort((a, b) => b.purchase_count - a.purchase_count);

      return aggregatedData;
    },
    enabled: !!customerId && open,
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
    return price.toLocaleString('id-ID');
  };

  const isLoading = isLoadingTransactions || isLoadingFavorites;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Data Pelanggan</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">
              <Receipt className="h-4 w-4 mr-2" />
              Riwayat Transaksi
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <TrendingUp className="h-4 w-4 mr-2" />
              Produk Favorit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              transactions.map((transaction: any) => (
                <Card key={transaction.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-lg">{transaction.transaction_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-primary">
                          Rp {transaction.total_amount.toLocaleString('id-ID')}
                        </div>
                        {transaction.points_earned > 0 && (
                          <Badge variant="secondary" className="mt-1">
                            +{transaction.points_earned} poin
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="text-sm font-medium mb-2">Item yang dibeli:</div>
                      <div className="space-y-2">
                        {transaction.transaction_items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.products?.name} <span className="text-xs">x{item.quantity}</span>
                            </span>
                            <span className="font-medium">
                              Rp {item.total_price.toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada riwayat transaksi
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : favoriteProducts && favoriteProducts.length > 0 ? (
              <div className="grid gap-4">
                {favoriteProducts.map((product: any, index: number) => (
                  <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <ShoppingCart className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{product.name}</h3>
                          {index === 0 && (
                            <Badge className="bg-yellow-500">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              TERLARIS
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Dibeli {product.purchase_count}x ({product.total_quantity} item)
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="font-semibold text-primary">
                            Rp {formatPrice(product.selling_price)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Stok: {product.current_stock}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.current_stock < 1}
                        size="sm"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Tambah
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada produk favorit
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFavoritesModal;
