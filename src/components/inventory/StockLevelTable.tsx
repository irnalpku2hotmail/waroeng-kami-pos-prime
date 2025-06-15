
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  barcode: string;
  image_url: string;
  current_stock: number;
  min_stock: number;
  categories: { name: string };
  units: { abbreviation: string };
}

interface StockLevelTableProps {
  products: Product[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const StockLevelTable = ({ products, searchTerm, onSearchChange }: StockLevelTableProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment_type: 'increase',
    quantity_change: 0,
    reason: ''
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('stock_adjustments')
        .insert({
          product_id: selectedProduct?.id,
          user_id: user?.id,
          adjustment_type: data.adjustment_type,
          quantity_change: parseInt(data.quantity_change),
          previous_stock: selectedProduct?.current_stock,
          new_stock: selectedProduct?.current_stock + (data.adjustment_type === 'increase' ? parseInt(data.quantity_change) : -parseInt(data.quantity_change)),
          reason: data.reason
        });

      if (error) throw error;

      // Update product stock
      const newStock = data.adjustment_type === 'increase' 
        ? selectedProduct?.current_stock + parseInt(data.quantity_change)
        : selectedProduct?.current_stock - parseInt(data.quantity_change);

      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', selectedProduct?.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({ title: 'Stok berhasil disesuaikan' });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setSelectedProduct(null);
      setAdjustmentData({ adjustment_type: 'increase', quantity_change: 0, reason: '' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error adjusting stock', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  return (
    <>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Level Stok Saat Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Stok Saat Ini</TableHead>
                <TableHead>Stok Minimum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.barcode}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.categories?.name}</TableCell>
                  <TableCell>{product.current_stock} {product.units?.abbreviation}</TableCell>
                  <TableCell>{product.min_stock}</TableCell>
                  <TableCell>
                    {product.current_stock <= product.min_stock ? (
                      <Badge variant="destructive">Stok Rendah</Badge>
                    ) : product.current_stock <= product.min_stock * 2 ? (
                      <Badge variant="secondary">Peringatan</Badge>
                    ) : (
                      <Badge variant="default">Baik</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedProduct(product)}
                    >
                      Sesuaikan
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesuaikan Stok - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Stok Saat Ini: {selectedProduct?.current_stock} {selectedProduct?.units?.abbreviation}</Label>
            </div>
            <div>
              <Label>Jenis Penyesuaian</Label>
              <Select 
                value={adjustmentData.adjustment_type} 
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, adjustment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Tambah</SelectItem>
                  <SelectItem value="decrease">Kurangi</SelectItem>
                  <SelectItem value="correction">Koreksi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah</Label>
              <Input
                type="number"
                value={adjustmentData.quantity_change}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity_change: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Alasan</Label>
              <Textarea
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Alasan penyesuaian..."
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => adjustStockMutation.mutate(adjustmentData)}
              disabled={adjustStockMutation.isPending}
            >
              {adjustStockMutation.isPending ? 'Menyesuaikan...' : 'Sesuaikan Stok'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StockLevelTable;
