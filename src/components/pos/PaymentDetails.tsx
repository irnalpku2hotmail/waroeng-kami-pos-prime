
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Printer } from 'lucide-react';
import { CartItem } from '@/hooks/usePOS';

interface PaymentDetailsProps {
  cart: CartItem[];
  getTotalAmount: () => number;
  selectedCustomer: any;
  getTotalPointsEarned: () => number;
  paymentType: 'cash' | 'credit' | 'transfer';
  setPaymentType: (type: 'cash' | 'credit' | 'transfer') => void;
  paymentAmount: number;
  setPaymentAmount: (amount: number) => void;
  getChangeAmount: () => number;
  transferReference: string;
  setTransferReference: (ref: string) => void;
  processTransaction: {
    mutate: () => void;
    isPending: boolean;
  };
  printReceipt: (transaction: any) => void;
  user: any;
  settings: any;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  cart,
  getTotalAmount,
  selectedCustomer,
  getTotalPointsEarned,
  paymentType,
  setPaymentType,
  paymentAmount,
  setPaymentAmount,
  getChangeAmount,
  transferReference,
  setTransferReference,
  processTransaction,
  printReceipt,
  user,
  settings,
}) => {
  const handlePrintReceipt = () => {
    const mockTransaction = {
      transaction_number: `TRX${Date.now()}`,
      created_at: new Date().toISOString(),
      total_amount: getTotalAmount(),
    };
    printReceipt(mockTransaction);
  };
  if (cart.length === 0) {
    return null;
  }

  const totalAmount = getTotalAmount();

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-sm text-blue-600">
          <span>Poin yang didapat:</span>
          <span>{getTotalPointsEarned()} pts</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Metode Pembayaran</label>
        <Select value={paymentType} onValueChange={(value: 'cash' | 'credit' | 'transfer') => setPaymentType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="credit">Credit (7 Hari)</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentType === 'cash' && (
        <div>
          <label className="text-sm font-medium">Jumlah Bayar</label>
          <Input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            placeholder="Masukkan jumlah bayar"
          />
          {paymentAmount > 0 && (
            <div className="flex justify-between mt-2 text-sm">
              <span>Kembalian:</span>
              <span className="font-bold">Rp {getChangeAmount().toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>
      )}

      {paymentType === 'transfer' && (
        <div>
          <label className="text-sm font-medium">Nomor Referensi</label>
          <Input
            type="text"
            value={transferReference}
            onChange={(e) => setTransferReference(e.target.value)}
            placeholder="Masukkan nomor referensi transfer"
          />
        </div>
      )}

      {paymentType === 'credit' && (
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
          Jatuh tempo: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handlePrintReceipt}
          disabled={cart.length === 0}
          className="flex-1"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Faktur
        </Button>
        <Button
          className="flex-1"
          onClick={() => processTransaction.mutate()}
          disabled={
            cart.length === 0 || 
            (paymentType === 'cash' && paymentAmount < totalAmount) ||
            (paymentType === 'transfer' && !transferReference) ||
            processTransaction.isPending
          }
        >
          <DollarSign className="h-4 w-4 mr-2" />
          {processTransaction.isPending ? 'Memproses...' : 'Proses Transaksi'}
        </Button>
      </div>
    </div>
  );
};

export default PaymentDetails;
