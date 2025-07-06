
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign } from 'lucide-react';

interface PurchasePaymentFormProps {
  purchase: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PurchasePaymentForm = ({ purchase, open, onOpenChange }: PurchasePaymentFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [paymentData, setPaymentData] = useState({
    payment_amount: purchase?.total_amount || 0,
    notes: ''
  });

  const createPayment = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('purchase_payments')
        .insert([{
          purchase_id: purchase.id,
          payment_amount: data.payment_amount,
          payment_date: new Date().toISOString().split('T')[0],
          notes: data.notes,
          user_id: user?.id
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ 
        title: 'Berhasil', 
        description: 'Pembayaran berhasil dicatat' 
      });
      onOpenChange(false);
      setPaymentData({ payment_amount: 0, notes: '' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPayment.mutate(paymentData);
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pembayaran Pembelian
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Pembelian: {purchase?.purchase_number}
            </p>
            <p className="text-sm text-gray-600">
              Total: {formatCurrency(purchase?.total_amount || 0)}
            </p>
            <p className="text-sm text-gray-600">
              Supplier: {purchase?.suppliers?.name}
            </p>
            <p className="text-sm text-gray-600">
              Status: <span className={`font-medium ${
                purchase?.payment_status === 'paid' ? 'text-green-600' :
                purchase?.payment_status === 'partial' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {purchase?.payment_status === 'paid' ? 'Lunas' :
                 purchase?.payment_status === 'partial' ? 'Sebagian' : 'Belum Bayar'}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_amount">Jumlah Pembayaran *</Label>
            <Input
              id="payment_amount"
              type="number"
              value={paymentData.payment_amount}
              onChange={(e) => setPaymentData(prev => ({ ...prev, payment_amount: Number(e.target.value) }))}
              placeholder="0"
              min="0"
              max={purchase?.total_amount}
              required
            />
            <p className="text-xs text-gray-500">
              Maksimal: {formatCurrency(purchase?.total_amount || 0)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={paymentData.notes}
              onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Catatan pembayaran (opsional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={!paymentData.payment_amount || paymentData.payment_amount <= 0}
            >
              Catat Pembayaran
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PurchasePaymentForm;
