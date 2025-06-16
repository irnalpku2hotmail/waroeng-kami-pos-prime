
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

interface CreditPaymentFormProps {
  purchase: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreditPaymentForm = ({ purchase, open, onOpenChange }: CreditPaymentFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [paymentData, setPaymentData] = useState({
    payment_amount: purchase?.total_amount || 0,
    notes: ''
  });

  const createPayment = useMutation({
    mutationFn: async (data: any) => {
      // Check if this is a purchase (from purchases table) or transaction (from transactions table)
      const isPurchase = purchase?.purchase_number; // purchases have purchase_number, transactions have transaction_number
      
      if (isPurchase) {
        // Handle purchase credit payment
        if (purchase.payment_method === 'cash') {
          throw new Error('Pembelian ini sudah lunas');
        }

        // Record the payment in credit_payments table
        const { error: paymentError } = await supabase
          .from('credit_payments')
          .insert([{
            transaction_id: purchase.id,
            payment_amount: data.payment_amount,
            payment_date: new Date().toISOString().split('T')[0],
            notes: data.notes,
            user_id: user?.id
          }]);
        
        if (paymentError) throw paymentError;

        // Update purchase status to paid
        const { error: updateError } = await supabase
          .from('purchases')
          .update({ payment_method: 'cash' })
          .eq('id', purchase.id);
        
        if (updateError) throw updateError;
      } else {
        // Handle transaction credit payment (customer credit)
        if (!purchase.is_credit) {
          throw new Error('Transaksi ini bukan transaksi kredit');
        }

        // Record the payment in credit_payments table
        const { error: paymentError } = await supabase
          .from('credit_payments')
          .insert([{
            transaction_id: purchase.id,
            payment_amount: data.payment_amount,
            payment_date: new Date().toISOString().split('T')[0],
            notes: data.notes,
            user_id: user?.id
          }]);
        
        if (paymentError) throw paymentError;

        // Update transaction status to paid
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ is_credit: false })
          .eq('id', purchase.id);
        
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      const isPurchase = purchase?.purchase_number;
      
      if (isPurchase) {
        queryClient.invalidateQueries({ queryKey: ['purchases'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['credit-stats'] });
      }
      
      toast({ 
        title: 'Berhasil', 
        description: 'Pembayaran berhasil dicatat dan status diperbarui' 
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

  const isPurchase = purchase?.purchase_number;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {isPurchase ? 'Pembayaran Pembelian' : 'Pembayaran Piutang Pelanggan'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {isPurchase ? `Pembelian: ${purchase?.purchase_number}` : `Transaksi: ${purchase?.transaction_number}`}
            </p>
            <p className="text-sm text-gray-600">
              Total: {formatCurrency(purchase?.total_amount || 0)}
            </p>
            <p className="text-sm text-gray-600">
              {isPurchase ? `Supplier: ${purchase?.suppliers?.name}` : `Pelanggan: ${purchase?.customers?.name || 'Customer Umum'}`}
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

export default CreditPaymentForm;
