
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Info } from 'lucide-react';

interface StockAdjustmentDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StockAdjustmentDialog = ({ product, open, onOpenChange }: StockAdjustmentDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [adjustmentData, setAdjustmentData] = useState({
    adjustment_type: 'manual_add',
    quantity_change: 0,
    reason: ''
  });

  const createAdjustment = useMutation({
    mutationFn: async (data: any) => {
      const newStock = product.current_stock + data.quantity_change;
      
      if (newStock < 0) {
        throw new Error('Stok tidak boleh negatif');
      }
      
      // Insert stock adjustment record
      const { error: adjustmentError } = await supabase
        .from('stock_adjustments')
        .insert([{
          product_id: product.id,
          user_id: user?.id,
          adjustment_type: data.adjustment_type,
          quantity_change: data.quantity_change,
          previous_stock: product.current_stock,
          new_stock: newStock,
          reason: data.reason
        }]);
      
      if (adjustmentError) throw adjustmentError;

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', product.id);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      toast({ 
        title: 'Berhasil', 
        description: 'Stok berhasil disesuaikan' 
      });
      onOpenChange(false);
      setAdjustmentData({ adjustment_type: 'manual_add', quantity_change: 0, reason: '' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adjustmentData.reason.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Alasan penyesuaian harus diisi untuk dokumentasi',
        variant: 'destructive' 
      });
      return;
    }

    if (adjustmentData.quantity_change === 0) {
      toast({ 
        title: 'Error', 
        description: 'Jumlah perubahan tidak boleh kosong',
        variant: 'destructive' 
      });
      return;
    }

    createAdjustment.mutate(adjustmentData);
  };

  const adjustmentTypes = [
    { value: 'manual_add', label: 'Koreksi Manual - Tambah' },
    { value: 'manual_reduce', label: 'Koreksi Manual - Kurangi' },
    { value: 'damaged', label: 'Barang Rusak' },
    { value: 'expired', label: 'Barang Kadaluarsa' },
    { value: 'lost', label: 'Barang Hilang' },
    { value: 'found', label: 'Barang Ditemukan' }
  ];

  const handleQuantityChange = (value: string) => {
    const numValue = Number(value);
    let adjustedValue = numValue;

    if (adjustmentData.adjustment_type.includes('reduce') || 
        adjustmentData.adjustment_type === 'damaged' ||
        adjustmentData.adjustment_type === 'expired' ||
        adjustmentData.adjustment_type === 'lost') {
      adjustedValue = -Math.abs(numValue);
    } else {
      adjustedValue = Math.abs(numValue);
    }

    setAdjustmentData(prev => ({ 
      ...prev, 
      quantity_change: adjustedValue
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Penyesuaian Stok Manual
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">Informasi Penting</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Fitur ini hanya untuk koreksi manual stok (kerusakan, kehilangan, dll). 
            Stok otomatis bertambah saat pembelian dan berkurang saat penjualan/return.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Peringatan</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            JANGAN gunakan fitur ini untuk mencatat pembelian atau penjualan. 
            Gunakan form pembelian/penjualan yang sesuai untuk menghindari duplikasi stok.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Produk: <span className="font-medium">{product?.name}</span>
            </p>
            <p className="text-sm text-gray-600">
              Stok Saat Ini: <span className="font-medium">{product?.current_stock} unit</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment_type">Jenis Penyesuaian *</Label>
            <Select
              value={adjustmentData.adjustment_type}
              onValueChange={(value) => setAdjustmentData(prev => ({ 
                ...prev, 
                adjustment_type: value,
                quantity_change: 0 // Reset quantity when type changes
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis penyesuaian" />
              </SelectTrigger>
              <SelectContent>
                {adjustmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity_change">Jumlah Perubahan *</Label>
            <Input
              id="quantity_change"
              type="number"
              value={Math.abs(adjustmentData.quantity_change)}
              onChange={(e) => handleQuantityChange(e.target.value)}
              placeholder="0"
              min="0"
              required
            />
            <p className="text-xs text-gray-500">
              Stok Setelah Penyesuaian: {Math.max(0, product?.current_stock + adjustmentData.quantity_change)} unit
              {(product?.current_stock + adjustmentData.quantity_change) < 0 && (
                <span className="text-red-600 ml-2">(Tidak valid - stok tidak boleh negatif)</span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Penyesuaian *</Label>
            <Textarea
              id="reason"
              value={adjustmentData.reason}
              onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Jelaskan alasan penyesuaian stok ini secara detail..."
              required
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Wajib diisi untuk dokumentasi dan audit. Contoh: "10 unit rusak karena terjatuh", "Koreksi hasil opname fisik"
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={
                !adjustmentData.reason.trim() || 
                adjustmentData.quantity_change === 0 ||
                (product?.current_stock + adjustmentData.quantity_change) < 0
              }
            >
              Sesuaikan Stok
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentDialog;
