
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2 } from 'lucide-react';
import { getConversionFactor } from '@/hooks/useUnitConversions';

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
  const [autoUpdatePrice, setAutoUpdatePrice] = useState(false);

  // Auto-set due date when payment method changes to credit
  useEffect(() => {
    if (formData.payment_method === 'credit' && !formData.due_date) {
      const dueDate = new Date(formData.purchase_date);
      dueDate.setDate(dueDate.getDate() + 14);
      setFormData(prev => ({
        ...prev,
        due_date: dueDate.toISOString().split('T')[0]
      }));
    } else if (formData.payment_method === 'cash') {
      setFormData(prev => ({
        ...prev,
        due_date: ''
      }));
    }
  }, [formData.payment_method, formData.purchase_date]);

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
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          units(id, name, abbreviation),
          unit_conversions(id, from_unit_id, to_unit_id, conversion_factor,
            from_unit:from_unit_id(id, name, abbreviation),
            to_unit:to_unit_id(id, name, abbreviation)
          )
        `)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('*').order('name');
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
            purchase_id: purchaseId,
            purchase_unit_id: item.purchase_unit_id,
            conversion_factor: item.conversion_factor || 1
          })));
        if (error) throw error;

        // Auto update product base price if enabled
        if (autoUpdatePrice) {
          for (const item of items) {
            await supabase
              .from('products')
              .update({ base_price: item.unit_cost })
              .eq('id', item.product_id);
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      if (autoUpdatePrice) {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
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
      expiration_date: '',
      purchase_unit_id: '',
      conversion_factor: 1
    }]);
  };

  const updateItem = async (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill unit cost from product base price and set default purchase unit
    if (field === 'product_id' && value && products) {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index].unit_cost = selectedProduct.base_price || 0;
        newItems[index].purchase_unit_id = selectedProduct.units?.id || '';
        newItems[index].conversion_factor = 1;
        newItems[index].total_cost = newItems[index].quantity * (selectedProduct.base_price || 0);
      }
    }
    
    // Handle unit change and calculate conversion
    if (field === 'purchase_unit_id' && value && newItems[index].product_id) {
      const selectedProduct = products?.find(p => p.id === newItems[index].product_id);
      if (selectedProduct && selectedProduct.units?.id) {
        try {
          const conversionFactor = await getConversionFactor(
            newItems[index].product_id,
            value,
            selectedProduct.units.id
          );
          newItems[index].conversion_factor = conversionFactor;
        } catch (error) {
          console.error('Error getting conversion factor:', error);
          newItems[index].conversion_factor = 1;
        }
      }
    }
    
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
    savePurchase.mutate(formData);
  };

  const getAvailableUnitsForProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return [];
    
    const availableUnits = [product.units].filter(Boolean);
    
    // Add units that have conversions defined for this product
    if (product.unit_conversions) {
      product.unit_conversions.forEach((conversion: any) => {
        if (conversion.from_unit && !availableUnits.find(u => u.id === conversion.from_unit.id)) {
          availableUnits.push(conversion.from_unit);
        }
      });
    }
    
    return availableUnits;
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
          <Label htmlFor="payment_method">Metode Pembayaran *</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
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
          placeholder="Catatan tambahan"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="auto-update-price"
          checked={autoUpdatePrice}
          onCheckedChange={setAutoUpdatePrice}
        />
        <Label htmlFor="auto-update-price">Auto Update Harga Beli Produk</Label>
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
              <TableHead>Unit Pembelian</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Harga Satuan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Konversi</TableHead>
              <TableHead>Tanggal Kedaluwarsa</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const selectedProduct = products?.find(p => p.id === item.product_id);
              const availableUnits = getAvailableUnitsForProduct(item.product_id);
              const baseUnit = selectedProduct?.units;
              const conversionText = item.conversion_factor !== 1 && baseUnit 
                ? `1 unit pembelian = ${item.conversion_factor} ${baseUnit.abbreviation}`
                : '';

              return (
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
                            {product.name} (Rp {product.base_price?.toLocaleString('id-ID')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.purchase_unit_id}
                      onValueChange={(value) => updateItem(index, 'purchase_unit_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
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
                    {conversionText && (
                      <Badge variant="secondary" className="text-xs">
                        {conversionText}
                      </Badge>
                    )}
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
          {purchase ? 'Update Pembelian' : 'Simpan Pembelian'}
        </Button>
      </div>
    </form>
  );
};

export default PurchaseForm;
