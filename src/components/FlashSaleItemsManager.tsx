
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Search, Package, Trash2, Plus } from 'lucide-react';
import ProductSearchModal from './ProductSearchModal';

interface FlashSaleItemsManagerProps {
  flashSaleId?: string;
  onItemsChange?: () => void;
}

const FlashSaleItemsManager = ({ flashSaleId, onItemsChange }: FlashSaleItemsManagerProps) => {
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch flash sale items
  const { data: flashSaleItems = [], isLoading } = useQuery({
    queryKey: ['flash-sale-items', flashSaleId],
    queryFn: async () => {
      if (!flashSaleId) return [];
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select(`
          *,
          products(name, selling_price, current_stock, image_url)
        `)
        .eq('flash_sale_id', flashSaleId);
      if (error) throw error;
      return data;
    },
    enabled: !!flashSaleId
  });

  const addProductToFlashSale = useMutation({
    mutationFn: async ({ product, discountPercentage, stockQuantity, maxQuantityPerCustomer }: { 
      product: any, 
      discountPercentage: number,
      stockQuantity: number,
      maxQuantityPerCustomer: number
    }) => {
      if (!flashSaleId) throw new Error('Flash sale ID is required');
      
      const salePrice = product.selling_price * (1 - discountPercentage / 100);
      
      const { error } = await supabase
        .from('flash_sale_items')
        .insert([{
          flash_sale_id: flashSaleId,
          product_id: product.id,
          original_price: product.selling_price,
          sale_price: salePrice,
          discount_percentage: discountPercentage,
          stock_quantity: stockQuantity,
          max_quantity_per_customer: maxQuantityPerCustomer,
          sold_quantity: 0
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-items', flashSaleId] });
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale-stats'] });
      if (onItemsChange) onItemsChange();
      toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan ke flash sale' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateFlashSaleItem = useMutation({
    mutationFn: async ({ itemId, discountPercentage, stockQuantity, maxQuantityPerCustomer }: {
      itemId: string,
      discountPercentage: number,
      stockQuantity: number,
      maxQuantityPerCustomer: number
    }) => {
      const item = flashSaleItems.find(item => item.id === itemId);
      if (!item) throw new Error('Item not found');
      
      const salePrice = item.original_price * (1 - discountPercentage / 100);
      
      const { error } = await supabase
        .from('flash_sale_items')
        .update({
          sale_price: salePrice,
          discount_percentage: discountPercentage,
          stock_quantity: stockQuantity,
          max_quantity_per_customer: maxQuantityPerCustomer
        })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-items', flashSaleId] });
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      setEditingItem(null);
      if (onItemsChange) onItemsChange();
      toast({ title: 'Berhasil', description: 'Item flash sale berhasil diperbarui' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteFlashSaleItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('flash_sale_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-items', flashSaleId] });
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      if (onItemsChange) onItemsChange();
      toast({ title: 'Berhasil', description: 'Item berhasil dihapus dari flash sale' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSelectProduct = (product: any) => {
    // Set default values for new product
    const defaultDiscount = 10;
    const defaultStock = Math.min(product.current_stock, 50);
    const defaultMaxQuantity = 5;

    addProductToFlashSale.mutate({
      product,
      discountPercentage: defaultDiscount,
      stockQuantity: defaultStock,
      maxQuantityPerCustomer: defaultMaxQuantity
    });
  };

  const handleUpdateItem = (item: any, formData: FormData) => {
    const discountPercentage = parseFloat(formData.get('discount') as string);
    const stockQuantity = parseInt(formData.get('stock') as string);
    const maxQuantityPerCustomer = parseInt(formData.get('maxQuantity') as string);

    updateFlashSaleItem.mutate({
      itemId: item.id,
      discountPercentage,
      stockQuantity,
      maxQuantityPerCustomer
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  if (!flashSaleId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">Simpan flash sale terlebih dahulu untuk menambahkan produk</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Produk Flash Sale</CardTitle>
          <Button onClick={() => setShowProductSearch(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Produk
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : flashSaleItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada produk ditambahkan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Harga Asli</TableHead>
                  <TableHead>Diskon</TableHead>
                  <TableHead>Harga Flash Sale</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Max/Customer</TableHead>
                  <TableHead>Terjual</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flashSaleItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getImageUrl(item.products.image_url) ? (
                            <img 
                              src={getImageUrl(item.products.image_url)} 
                              alt={item.products.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.products.name}</p>
                          <p className="text-xs text-gray-500">Stok tersedia: {item.products.current_stock}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(item.original_price)}</TableCell>
                    <TableCell>
                      {editingItem?.id === item.id ? (
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleUpdateItem(item, formData);
                          }}
                          className="space-y-2"
                        >
                          <Input
                            name="discount"
                            type="number"
                            defaultValue={item.discount_percentage}
                            min="0"
                            max="100"
                            className="w-20"
                          />
                          <Input
                            name="stock"
                            type="number"
                            defaultValue={item.stock_quantity}
                            min="1"
                            max={item.products.current_stock}
                            className="w-20"
                          />
                          <Input
                            name="maxQuantity"
                            type="number"
                            defaultValue={item.max_quantity_per_customer}
                            min="1"
                            className="w-20"
                          />
                          <div className="flex gap-2">
                            <Button type="submit" size="sm">Simpan</Button>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingItem(null)}
                            >
                              Batal
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <Badge variant="secondary">{item.discount_percentage}%</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatCurrency(item.sale_price)}
                    </TableCell>
                    <TableCell>
                      {editingItem?.id === item.id ? (
                        <span className="text-xs text-gray-500">Edit di atas</span>
                      ) : (
                        item.stock_quantity
                      )}
                    </TableCell>
                    <TableCell>
                      {editingItem?.id === item.id ? (
                        <span className="text-xs text-gray-500">Edit di atas</span>
                      ) : (
                        item.max_quantity_per_customer
                      )}
                    </TableCell>
                    <TableCell>{item.sold_quantity}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingItem?.id === item.id ? null : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteFlashSaleItem.mutate(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProductSearchModal
        open={showProductSearch}
        onOpenChange={setShowProductSearch}
        onSelectProduct={handleSelectProduct}
        flashSaleId={flashSaleId}
      />
    </div>
  );
};

export default FlashSaleItemsManager;
