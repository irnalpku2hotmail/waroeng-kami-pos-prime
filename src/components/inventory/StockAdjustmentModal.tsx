
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const StockAdjustmentModal = ({ open, onOpenChange, product }: StockAdjustmentModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'correction'>('increase');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const adjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('stock_adjustments').insert([data]);
      if (error) throw error;

      // Update product stock
      let newStock = product.current_stock;
      if (data.adjustment_type === 'increase') {
        newStock = product.current_stock + data.quantity_change;
      } else if (data.adjustment_type === 'decrease') {
        newStock = product.current_stock - data.quantity_change;
      } else if (data.adjustment_type === 'correction') {
        newStock = data.new_stock;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', product.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      toast({
        title: 'Berhasil',
        description: 'Penyesuaian stok berhasil disimpan'
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setQuantity('');
    setReason('');
    setAdjustmentType('increase');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !quantity || !reason) {
      toast({
        title: 'Error',
        description: 'Semua field harus diisi',
        variant: 'destructive'
      });
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: 'Error',
        description: 'Jumlah harus berupa angka positif',
        variant: 'destructive'
      });
      return;
    }

    let newStock = product.current_stock;
    let quantityChange = quantityNum;

    if (adjustmentType === 'increase') {
      newStock = product.current_stock + quantityNum;
    } else if (adjustmentType === 'decrease') {
      if (quantityNum > product.current_stock) {
        toast({
          title: 'Error',
          description: 'Jumlah pengurangan tidak boleh melebihi stok saat ini',
          variant: 'destructive'
        });
        return;
      }
      newStock = product.current_stock - quantityNum;
    } else if (adjustmentType === 'correction') {
      newStock = quantityNum;
      quantityChange = Math.abs(newStock - product.current_stock);
    }

    adjustmentMutation.mutate({
      product_id: product.id,
      user_id: user.id,
      adjustment_type: adjustmentType,
      quantity_change: quantityChange,
      previous_stock: product.current_stock,
      new_stock: newStock,
      reason
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Penyesuaian Stok - {product?.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Stok Saat Ini</p>
            <p className="text-2xl font-bold text-blue-600">
              {product?.current_stock} {product?.units?.abbreviation}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustmentType">Jenis Penyesuaian</Label>
            <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">Tambah Stok</SelectItem>
                <SelectItem value="decrease">Kurangi Stok</SelectItem>
                <SelectItem value="correction">Koreksi Stok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              {adjustmentType === 'correction' ? 'Stok Baru' : 'Jumlah'}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={adjustmentType === 'correction' ? 'Masukkan stok yang benar' : 'Masukkan jumlah'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan penyesuaian stok"
              rows={3}
            />
          </div>

          {adjustmentType !== 'correction' && quantity && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Stok Setelah Penyesuaian</p>
              <p className="text-lg font-semibold text-blue-600">
                {adjustmentType === 'increase' 
                  ? product?.current_stock + parseInt(quantity || '0')
                  : product?.current_stock - parseInt(quantity || '0')
                } {product?.units?.abbreviation}
              </p>
            </div>
          )}

          {adjustmentType === 'correction' && quantity && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Stok Akan Diubah Menjadi</p>
              <p className="text-lg font-semibold text-blue-600">
                {quantity} {product?.units?.abbreviation}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={adjustmentMutation.isPending}
              className="flex-1"
            >
              {adjustmentMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentModal;
