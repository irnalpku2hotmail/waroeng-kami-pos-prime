
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PurchaseItemsTable from '@/components/purchase/PurchaseItemsTable';

interface PurchaseFormProps {
  purchase?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const PurchaseForm = ({ purchase, onSuccess, onCancel }: PurchaseFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    invoice_number: purchase?.invoice_number || '',
    supplier_id: purchase?.supplier_id || '',
    payment_method: purchase?.payment_method || 'cash',
    purchase_date: purchase?.purchase_date || new Date().toISOString().split('T')[0],
    due_date: purchase?.due_date || '',
    notes: purchase?.notes || ''
  });

  const [items, setItems] = useState(purchase?.purchase_items || []);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const savePurchase = useMutation({
    mutationFn: async (data: any) => {
      if (purchase) {
        const { error } = await supabase
          .from('purchases')
          .update({
            invoice_number: data.invoice_number,
            supplier_id: data.supplier_id,
            payment_method: data.payment_method,
            purchase_date: data.purchase_date,
            due_date: data.payment_method === 'credit' ? data.due_date : null,
            notes: data.notes,
            total_amount: items.reduce((sum, item) => sum + (item.total_cost || 0), 0)
          })
          .eq('id', purchase.id);
        if (error) throw error;
        return purchase.id;
      } else {
        const { data: newPurchase, error } = await supabase
          .from('purchases')
          .insert([{
            ...data,
            user_id: user?.id,
            purchase_number: `PUR-${Date.now()}`,
            due_date: data.payment_method === 'credit' ? data.due_date : null,
            total_amount: items.reduce((sum, item) => sum + (item.total_cost || 0), 0)
          }])
          .select()
          .single();
        if (error) throw error;
        return newPurchase.id;
      }
    },
    onSuccess: async (purchaseId) => {
      if (items.length > 0) {
        if (purchase) {
          await supabase.from('purchase_items').delete().eq('purchase_id', purchase.id);
        }
        
        // Insert purchase items - Let the trigger handle stock updates
        const { error } = await supabase
          .from('purchase_items')
          .insert(items.map(item => ({
            ...item,
            purchase_id: purchaseId
          })));
        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
      toast({ title: 'Berhasil', description: purchase ? 'Pembelian berhasil diperbarui' : 'Pembelian berhasil ditambahkan' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Minimal harus ada satu item', variant: 'destructive' });
      return;
    }
    savePurchase.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_number">Nomor Invoice</Label>
          <Input
            id="invoice_number"
            value={formData.invoice_number}
            onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
            placeholder="INV-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier_id">Supplier *</Label>
          <Select
            value={formData.supplier_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers?.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_method">Metode Pembayaran *</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih metode pembayaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Tanggal Pembelian *</Label>
          <Input
            id="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
            required
          />
        </div>
        {formData.payment_method === 'credit' && (
          <div className="space-y-2">
            <Label htmlFor="due_date">Tanggal Jatuh Tempo</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Catatan pembelian"
        />
      </div>

      <PurchaseItemsTable items={items} setItems={setItems} />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={!formData.supplier_id || items.length === 0}>
          {purchase ? 'Update Pembelian' : 'Simpan Pembelian'}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseForm;
