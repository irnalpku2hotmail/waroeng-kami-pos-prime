
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2 } from 'lucide-react';

interface PurchaseFormProps {
  purchase?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const PurchaseForm = ({ purchase, onSuccess, onCancel }: PurchaseFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [purchaseData, setPurchaseData] = useState({
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

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
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
            due_date: data.due_date,
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
        
        const { error } = await supabase
          .from('purchase_items')
          .insert(items.map(item => ({
            ...item,
            purchase_id: purchaseId
          })));
        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ title: 'Berhasil', description: purchase ? 'Pembelian berhasil diperbarui' : 'Pembelian berhasil ditambahkan' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const addItem = () => {
    setItems([...items, {
      product_id: '',
      quantity: 1,
      unit_cost: 0,
      total_cost: 0,
      expiration_date: ''
    }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_cost') {
      newItems[index].total_cost = newItems[index].quantity * newItems[index].unit_cost;
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePurchase.mutate(purchaseData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_number">Nomor Invoice *</Label>
          <Input
            id="invoice_number"
            value={purchaseData.invoice_number}
            onChange={(e) => setPurchaseData(prev => ({ ...prev, invoice_number: e.target.value }))}
            placeholder="INV-001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier_id">Supplier *</Label>
          <Select
            value={purchaseData.supplier_id}
            onValueChange={(value) => setPurchaseData(prev => ({ ...prev, supplier_id: value }))}
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
            value={purchaseData.payment_method}
            onValueChange={(value) => setPurchaseData(prev => ({ ...prev, payment_method: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih metode" />
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
            value={purchaseData.purchase_date}
            onChange={(e) => setPurchaseData(prev => ({ ...prev, purchase_date: e.target.value }))}
            required
          />
        </div>
        {purchaseData.payment_method === 'credit' && (
          <div className="space-y-2">
            <Label htmlFor="due_date">Tanggal Jatuh Tempo</Label>
            <Input
              id="due_date"
              type="date"
              value={purchaseData.due_date}
              onChange={(e) => setPurchaseData(prev => ({ ...prev, due_date: e.target.value }))}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea
          id="notes"
          value={purchaseData.notes}
          onChange={(e) => setPurchaseData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Catatan pembelian"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Item Pembelian</h3>
          <Button type="button" onClick={addItem} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Item
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Harga Satuan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Tanggal Kadaluarsa</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Select
                    value={item.product_id}
                    onValueChange={(value) => updateItem(index, 'product_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    min="1"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={item.unit_cost}
                    onChange={(e) => updateItem(index, 'unit_cost', Number(e.target.value))}
                    min="0"
                  />
                </TableCell>
                <TableCell>
                  Rp {item.total_cost?.toLocaleString('id-ID') || 0}
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={item.expiration_date}
                    onChange={(e) => updateItem(index, 'expiration_date', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="text-right">
          <p className="text-lg font-medium">
            Total: Rp {items.reduce((sum, item) => sum + (item.total_cost || 0), 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" disabled={!purchaseData.invoice_number || !purchaseData.supplier_id || items.length === 0}>
          {purchase ? 'Update Pembelian' : 'Simpan Pembelian'}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseForm;
