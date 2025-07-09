
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  current_stock: number;
  units?: { abbreviation: string };
}

interface StockAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const StockAdjustmentDialog = ({ isOpen, onClose, product }: StockAdjustmentDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment_type: 'increase',
    quantity_change: 0,
    reason: ''
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!product) return;
      
      const currentStock = product.current_stock;
      const quantityChange = parseInt(data.quantity_change);
      let newStock: number;
      let quantityForRecord: number;
      
      if (data.adjustment_type === 'correction') {
        newStock = quantityChange;
        quantityForRecord = Math.abs(currentStock - newStock);
      } else {
        newStock = data.adjustment_type === 'increase' 
          ? currentStock + quantityChange
          : currentStock - quantityChange;
        quantityForRecord = quantityChange;
      }

      const { error } = await supabase
        .from('stock_adjustments')
        .insert({
          product_id: product.id,
          user_id: user?.id,
          adjustment_type: data.adjustment_type,
          quantity_change: quantityForRecord,
          previous_stock: currentStock,
          new_stock: newStock,
          reason: data.reason
        });

      if (error) throw error;

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', product.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({ title: 'Stok berhasil disesuaikan' });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setAdjustmentData({ adjustment_type: 'increase', quantity_change: 0, reason: '' });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error adjusting stock', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleSubmit = () => {
    adjustStockMutation.mutate(adjustmentData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sesuaikan Stok - {product?.name}</DialogTitle>
          <DialogDescription>
            Lakukan penyesuaian jumlah stok produk. Perubahan ini akan tercatat dalam riwayat.
          </DialogDescription>
        </DialogHeader>
        {product && (
          <div className="space-y-4 py-4">
            <div>
              <Label>Stok Saat Ini: {product.current_stock} {product.units?.abbreviation}</Label>
            </div>
            <div>
              <Label htmlFor="adjustment_type">Jenis Penyesuaian</Label>
              <Select
                name="adjustment_type"
                value={adjustmentData.adjustment_type} 
                onValueChange={(value) => setAdjustmentData(prev => ({ ...prev, adjustment_type: value }))}
              >
                <SelectTrigger id="adjustment_type">
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
              <Label htmlFor="quantity_change">Jumlah</Label>
              <Input
                id="quantity_change"
                type="number"
                value={adjustmentData.quantity_change}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity_change: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="reason">Alasan</Label>
              <Textarea
                id="reason"
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Alasan penyesuaian..."
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={adjustStockMutation.isPending}
            >
              {adjustStockMutation.isPending ? 'Menyesuaikan...' : 'Simpan Penyesuaian'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentDialog;
