import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Zap, Search, X } from 'lucide-react';
import Layout from '@/components/Layout';

const FlashSales = () => {
  const [open, setOpen] = useState(false);
  const [editSale, setEditSale] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'list'>('list');
  const queryClient = useQueryClient();

  const [saleData, setSaleData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  // Fetch products for search
  const { data: products = [] } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: async () => {
      if (!productSearch.trim()) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${productSearch}%`)
        .eq('is_active', true)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: productSearch.length > 0
  });

  const { data: flashSales, isLoading } = useQuery({
    queryKey: ['flash-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items (
            id,
            original_price,
            sale_price,
            discount_percentage,
            stock_quantity,
            sold_quantity,
            max_quantity_per_customer,
            products (
              id,
              name,
              selling_price
            )
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createFlashSale = useMutation({
    mutationFn: async (data: any) => {
      if (editSale) {
        // Update existing flash sale
        const { data: flashSale, error } = await supabase
          .from('flash_sales')
          .update({
            name: data.name,
            description: data.description,
            start_date: data.start_date,
            end_date: data.end_date
          })
          .eq('id', editSale.id)
          .select()
          .single();

        if (error) throw error;

        // Delete existing flash sale items
        await supabase
          .from('flash_sale_items')
          .delete()
          .eq('flash_sale_id', editSale.id);

        // Insert new flash sale items
        if (selectedProducts.length > 0) {
          const flashSaleItems = selectedProducts.map(product => ({
            flash_sale_id: flashSale.id,
            product_id: product.id,
            original_price: product.selling_price,
            sale_price: product.sale_price,
            discount_percentage: product.discount_percentage,
            stock_quantity: product.stock_quantity,
            max_quantity_per_customer: product.max_quantity_per_customer || null
          }));

          const { error: itemsError } = await supabase
            .from('flash_sale_items')
            .insert(flashSaleItems);

          if (itemsError) throw itemsError;
        }

        return flashSale;
      } else {
        // Create new flash sale
        const { data: flashSale, error } = await supabase
          .from('flash_sales')
          .insert({
            name: data.name,
            description: data.description,
            start_date: data.start_date,
            end_date: data.end_date
          })
          .select()
          .single();

        if (error) throw error;

        // Insert flash sale items
        if (selectedProducts.length > 0) {
          const flashSaleItems = selectedProducts.map(product => ({
            flash_sale_id: flashSale.id,
            product_id: product.id,
            original_price: product.selling_price,
            sale_price: product.sale_price,
            discount_percentage: product.discount_percentage,
            stock_quantity: product.stock_quantity,
            max_quantity_per_customer: product.max_quantity_per_customer || null
          }));

          const { error: itemsError } = await supabase
            .from('flash_sale_items')
            .insert(flashSaleItems);

          if (itemsError) throw itemsError;
        }

        return flashSale;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      setOpen(false);
      setSaleData({ name: '', description: '', start_date: '', end_date: '' });
      setSelectedProducts([]);
      setEditSale(null);
      toast({ title: 'Berhasil', description: editSale ? 'Flash sale berhasil diperbarui' : 'Flash sale berhasil dibuat' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteFlashSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('flash_sales').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      toast({ title: 'Berhasil', description: 'Flash sale berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleEdit = (sale: any) => {
    setEditSale(sale);
    setSaleData({
      name: sale.name,
      description: sale.description || '',
      start_date: sale.start_date ? new Date(sale.start_date).toISOString().slice(0, 16) : '',
      end_date: sale.end_date ? new Date(sale.end_date).toISOString().slice(0, 16) : ''
    });
    
    // Set selected products from existing flash sale items
    const existingProducts = sale.flash_sale_items?.map((item: any) => ({
      id: item.products.id,
      name: item.products.name,
      selling_price: item.original_price,
      sale_price: item.sale_price,
      discount_percentage: item.discount_percentage,
      stock_quantity: item.stock_quantity,
      max_quantity_per_customer: item.max_quantity_per_customer
    })) || [];
    
    setSelectedProducts(existingProducts);
    setOpen(true);
  };

  const addProductToSale = (product: any) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      toast({ title: 'Produk sudah ditambahkan', variant: 'destructive' });
      return;
    }
    setSelectedProducts([...selectedProducts, { 
      ...product, 
      sale_price: product.selling_price * 0.9, // Default 10% discount
      discount_percentage: 10,
      stock_quantity: 10,
      max_quantity_per_customer: 1
    }]);
    setProductSearch('');
    setShowProductSearch(false);
  };

  const removeProductFromSale = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const updateProductSaleData = (productId: string, field: string, value: any) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.id === productId) {
        const updated = { ...p, [field]: value };
        // Auto calculate discount percentage or sale price
        if (field === 'sale_price') {
          updated.discount_percentage = Math.round(((p.selling_price - value) / p.selling_price) * 100);
        } else if (field === 'discount_percentage') {
          updated.sale_price = p.selling_price * (1 - value / 100);
        }
        return updated;
      }
      return p;
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createFlashSale.mutate(saleData);
  };

  const resetForm = () => {
    setEditSale(null);
    setSaleData({ name: '', description: '', start_date: '', end_date: '' });
    setSelectedProducts([]);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Flash Sales</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'table' ? 'list' : 'table')}
            >
              {viewMode === 'table' ? 'List View' : 'Table View'}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Flash Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editSale ? 'Edit Flash Sale' : 'Buat Flash Sale Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Flash Sale *</Label>
                      <Input
                        id="name"
                        value={saleData.name}
                        onChange={(e) => setSaleData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Flash Sale Akhir Tahun"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        value={saleData.description}
                        onChange={(e) => setSaleData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Deskripsi flash sale"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Tanggal Mulai *</Label>
                      <Input
                        id="start_date"
                        type="datetime-local"
                        value={saleData.start_date}
                        onChange={(e) => setSaleData(prev => ({ ...prev, start_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">Tanggal Selesai *</Label>
                      <Input
                        id="end_date"
                        type="datetime-local"
                        value={saleData.end_date}
                        onChange={(e) => setSaleData(prev => ({ ...prev, end_date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Produk Flash Sale</Label>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowProductSearch(!showProductSearch)}
                        className="w-full"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Cari Produk
                      </Button>
                      
                      {showProductSearch && (
                        <div className="border rounded-lg p-4 space-y-2">
                          <Input
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="Cari produk..."
                          />
                          {products.length > 0 && (
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {products.map((product) => (
                                <div
                                  key={product.id}
                                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                  onClick={() => addProductToSale(product)}
                                >
                                  <span>{product.name}</span>
                                  <span className="text-sm text-gray-500">
                                    Rp {product.selling_price.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {selectedProducts.length > 0 && (
                        <div className="space-y-2">
                          <Label>Produk Terpilih:</Label>
                          <div className="space-y-3">
                            {selectedProducts.map((product) => (
                              <div key={product.id} className="border rounded-lg p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{product.name}</span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeProductFromSale(product.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div>
                                    <Label className="text-xs">Harga Asli</Label>
                                    <div className="text-sm">Rp {product.selling_price.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Harga Sale</Label>
                                    <Input
                                      type="number"
                                      value={product.sale_price}
                                      onChange={(e) => updateProductSaleData(product.id, 'sale_price', parseFloat(e.target.value))}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Diskon (%)</Label>
                                    <Input
                                      type="number"
                                      value={product.discount_percentage}
                                      onChange={(e) => updateProductSaleData(product.id, 'discount_percentage', parseInt(e.target.value))}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Stok Sale</Label>
                                    <Input
                                      type="number"
                                      value={product.stock_quantity}
                                      onChange={(e) => updateProductSaleData(product.id, 'stock_quantity', parseInt(e.target.value))}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs">Max per Customer</Label>
                                  <Input
                                    type="number"
                                    value={product.max_quantity_per_customer}
                                    onChange={(e) => updateProductSaleData(product.id, 'max_quantity_per_customer', parseInt(e.target.value))}
                                    className="h-8 w-32"
                                    placeholder="Unlimited"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={!saleData.name || !saleData.start_date || !saleData.end_date}>
                      {editSale ? 'Update Flash Sale' : 'Buat Flash Sale'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : flashSales?.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada flash sale</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-4 p-4">
              {flashSales?.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{sale.name}</h3>
                      <p className="text-gray-600">{sale.description || 'Tidak ada deskripsi'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Mulai: {new Date(sale.start_date).toLocaleDateString('id-ID')}</span>
                        <span>Selesai: {new Date(sale.end_date).toLocaleDateString('id-ID')}</span>
                        <span>{sale.flash_sale_items?.length || 0} produk</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sale.is_active ? (
                        <Badge variant="destructive" className="animate-pulse">
                          <Zap className="h-3 w-3 mr-1" />
                          FLASH
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(sale)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteFlashSale.mutate(sale.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {sale.flash_sale_items && sale.flash_sale_items.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Produk dalam Flash Sale:</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sale.flash_sale_items.map((item: any) => (
                          <div key={item.id} className="bg-gray-50 p-3 rounded border">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.products.name}</p>
                                <p className="text-sm text-gray-600">
                                  <span className="line-through">Rp {item.original_price.toLocaleString()}</span>
                                  {' → '}
                                  <span className="text-red-600 font-semibold">Rp {item.sale_price.toLocaleString()}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  Stok: {item.stock_quantity} | Terjual: {item.sold_quantity}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                -{item.discount_percentage}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Flash Sale</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Jumlah Produk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flashSales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.name}</TableCell>
                    <TableCell>{sale.description || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Mulai: {new Date(sale.start_date).toLocaleDateString('id-ID')}</div>
                        <div>Selesai: {new Date(sale.end_date).toLocaleDateString('id-ID')}</div>
                      </div>
                    </TableCell>
                    <TableCell>{sale.flash_sale_items?.length || 0}</TableCell>
                    <TableCell>
                      {sale.is_active ? (
                        <Badge variant="destructive" className="animate-pulse">
                          <Zap className="h-3 w-3 mr-1" />
                          FLASH
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteFlashSale.mutate(sale.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FlashSales;
