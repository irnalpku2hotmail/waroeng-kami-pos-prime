
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Upload, Package } from 'lucide-react';
import Layout from '@/components/Layout';

const Products = () => {
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation),
          suppliers(name)
        `);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) throw error;
      return data;
    }
  });

  const createProduct = useMutation({
    mutationFn: async (product: any) => {
      const { error } = await supabase.from('products').insert([product]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...product }: any) => {
      const { error } = await supabase.from('products').update(product).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setEditProduct(null);
      toast({ title: 'Berhasil', description: 'Produk berhasil diupdate' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Berhasil', description: 'Produk berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      name: formData.get('name') as string,
      barcode: formData.get('barcode') as string,
      category_id: formData.get('category_id') as string || null,
      unit_id: formData.get('unit_id') as string || null,
      supplier_id: formData.get('supplier_id') as string || null,
      base_price: Number(formData.get('base_price')),
      selling_price: Number(formData.get('selling_price')),
      min_quantity: Number(formData.get('min_quantity')),
      tier1_quantity: Number(formData.get('tier1_quantity')) || null,
      tier1_price: Number(formData.get('tier1_price')) || null,
      tier2_quantity: Number(formData.get('tier2_quantity')) || null,
      tier2_price: Number(formData.get('tier2_price')) || null,
      tier3_quantity: Number(formData.get('tier3_quantity')) || null,
      tier3_price: Number(formData.get('tier3_price')) || null,
      min_stock: Number(formData.get('min_stock')),
      current_stock: Number(formData.get('current_stock')),
      loyalty_points: Number(formData.get('loyalty_points')),
      description: formData.get('description') as string,
      is_active: formData.get('is_active') === 'on'
    };

    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, ...productData });
    } else {
      createProduct.mutate(productData);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Produk</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditProduct(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Produk *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editProduct?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      name="barcode"
                      defaultValue={editProduct?.barcode}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category_id">Kategori</Label>
                    <Select name="category_id" defaultValue={editProduct?.category_id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_id">Unit</Label>
                    <Select name="unit_id" defaultValue={editProduct?.unit_id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units?.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">Supplier</Label>
                    <Select name="supplier_id" defaultValue={editProduct?.supplier_id}>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Harga Pokok</Label>
                    <Input
                      id="base_price"
                      name="base_price"
                      type="number"
                      defaultValue={editProduct?.base_price}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Harga Jual</Label>
                    <Input
                      id="selling_price"
                      name="selling_price"
                      type="number"
                      defaultValue={editProduct?.selling_price}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Harga Bertingkat (Grosir)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tier1_quantity">Tier 1 - Minimal Qty</Label>
                      <Input
                        id="tier1_quantity"
                        name="tier1_quantity"
                        type="number"
                        defaultValue={editProduct?.tier1_quantity}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier1_price">Tier 1 - Harga</Label>
                      <Input
                        id="tier1_price"
                        name="tier1_price"
                        type="number"
                        defaultValue={editProduct?.tier1_price}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier2_quantity">Tier 2 - Minimal Qty</Label>
                      <Input
                        id="tier2_quantity"
                        name="tier2_quantity"
                        type="number"
                        defaultValue={editProduct?.tier2_quantity}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier2_price">Tier 2 - Harga</Label>
                      <Input
                        id="tier2_price"
                        name="tier2_price"
                        type="number"
                        defaultValue={editProduct?.tier2_price}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier3_quantity">Tier 3 - Minimal Qty</Label>
                      <Input
                        id="tier3_quantity"
                        name="tier3_quantity"
                        type="number"
                        defaultValue={editProduct?.tier3_quantity}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier3_price">Tier 3 - Harga</Label>
                      <Input
                        id="tier3_price"
                        name="tier3_price"
                        type="number"
                        defaultValue={editProduct?.tier3_price}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_quantity">Minimal Order</Label>
                    <Input
                      id="min_quantity"
                      name="min_quantity"
                      type="number"
                      defaultValue={editProduct?.min_quantity || 1}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_stock">Stok Minimal</Label>
                    <Input
                      id="min_stock"
                      name="min_stock"
                      type="number"
                      defaultValue={editProduct?.min_stock || 10}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_stock">Stok Saat Ini</Label>
                    <Input
                      id="current_stock"
                      name="current_stock"
                      type="number"
                      defaultValue={editProduct?.current_stock || 0}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loyalty_points">Poin Loyalty</Label>
                    <Input
                      id="loyalty_points"
                      name="loyalty_points"
                      type="number"
                      defaultValue={editProduct?.loyalty_points || 1}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editProduct?.description}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editProduct?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Produk Aktif</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editProduct ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari produk atau barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : products?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Belum ada produk</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products?.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription>
                          {product.categories?.name} • {product.units?.name}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditProduct(product);
                            setOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProduct.mutate(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Harga Jual:</span>
                        <span className="font-semibold">Rp {product.selling_price?.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stok:</span>
                        <span className={`font-semibold ${product.current_stock < product.min_stock ? 'text-red-600' : 'text-green-600'}`}>
                          {product.current_stock}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Poin Loyalty:</span>
                        <span>{product.loyalty_points}</span>
                      </div>
                      {product.barcode && (
                        <div className="flex justify-between">
                          <span>Barcode:</span>
                          <span className="text-sm text-gray-600">{product.barcode}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Products;
