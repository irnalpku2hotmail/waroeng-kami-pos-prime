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
import { Plus, Trash2, Search } from 'lucide-react';
import ProductSearchModal from '@/components/ProductSearchModal';

interface ReturnsFormProps {
  returnData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReturnsForm = ({ returnData, onSuccess, onCancel }: ReturnsFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    invoice_number: returnData?.invoice_number || '',
    supplier_id: returnData?.supplier_id || '',
    status: returnData?.status || 'process',
    return_date: returnData?.return_date || new Date().toISOString().split('T')[0],
    reason: returnData?.reason || ''
  });

  const [items, setItems] = useState(returnData?.return_items || []);
  const [searchModalOpen, setSearchModalOpen] = useState<number | null>(null);

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

  const saveReturn = useMutation({
    mutationFn: async (data: any) => {
      if (returnData) {
        const { error } = await supabase
          .from('returns')
          .update({
            invoice_number: data.invoice_number,
            supplier_id: data.supplier_id,
            status: data.status,
            return_date: data.return_date,
            reason: data.reason,
            total_amount: items.reduce((sum, item) => sum + (item.total_cost || 0), 0)
          })
          .eq('id', returnData.id);
        if (error) throw error;
        return returnData.id;
      } else {
        const { data: newReturn, error } = await supabase
          .from('returns')
          .insert([{
            ...data,
            user_id: user?.id,
            return_number: `RET-${Date.now()}`,
            total_amount: items.reduce((sum, item) => sum + (item.total_cost || 0), 0)
          }])
          .select()
          .single();
        if (error) throw error;
        return newReturn.id;
      }
    },
    onSuccess: async (returnId) => {
      if (items.length > 0) {
        if (returnData) {
          await supabase.from('return_items').delete().eq('return_id', returnData.id);
        }
        
        // Insert return items - stock will be handled by trigger based on status
        const { error } = await supabase
          .from('return_items')
          .insert(items.map(item => ({
            ...item,
            return_id: returnId
          })));
        if (error) throw error;
      }
      
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['return-stats'] });
      toast({ 
        title: 'Berhasil', 
        description: returnData ? 'Return berhasil diperbarui' : 'Return berhasil ditambahkan'
      });
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
      total_cost: 0
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
    saveReturn.mutate(formData);
  };

  const handleProductSelect = (product: any, index: number) => {
    const newItems = [...items];
    newItems[index].product_id = product.id;
    newItems[index].unit_cost = product.base_price || 0;
    newItems[index].total_cost = newItems[index].quantity * (product.base_price || 0);
    setItems(newItems);
    setSearchModalOpen(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_number">Nomor Invoice *</Label>
          <Input
            id="invoice_number"
            value={formData.invoice_number}
            onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
            placeholder="INV-001"
            required
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
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="process">Process</SelectItem>
              <SelectItem value="success">Success</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Stock hanya akan berkurang ketika status "Success"
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="return_date">Tanggal Return *</Label>
          <Input
            id="return_date"
            type="date"
            value={formData.return_date}
            onChange={(e) => setFormData(prev => ({ ...prev, return_date: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Alasan Return</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
          placeholder="Alasan return barang"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Item Return</h3>
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
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const selectedProduct = products?.find(p => p.id === item.product_id);
              return (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      {selectedProduct ? (
                        <>
                          <span className="font-medium text-sm">{selectedProduct.name}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setSearchModalOpen(index)}
                            title="Ganti Produk"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchModalOpen(index)}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Pilih Produk
                        </Button>
                      )}
                    </div>
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
              );
            })}
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
        <Button type="submit" disabled={!formData.invoice_number || !formData.supplier_id || items.length === 0}>
          {returnData ? 'Update Return' : 'Simpan Return'}
        </Button>
      </div>

      {/* Product Search Modal */}
      {searchModalOpen !== null && (
        <ProductSearchModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setSearchModalOpen(null);
          }}
          onSelectProduct={(product) => handleProductSelect(product, searchModalOpen)}
        />
      )}
    </form>
  );
};

export default ReturnsForm;
