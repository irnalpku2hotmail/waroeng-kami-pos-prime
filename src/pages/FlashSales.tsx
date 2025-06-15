import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Zap, Calendar, DollarSign, TrendingUp, Package, Search } from 'lucide-react';
import Layout from '@/components/Layout';
import ProductSearchModal from '@/components/ProductSearchModal';

const FlashSales = () => {
  const [open, setOpen] = useState(false);
  const [editFlashSale, setEditFlashSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState<any>(null);
  const queryClient = useQueryClient();

  const [flashSaleData, setFlashSaleData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    is_active: true
  });

  // Fetch flash sale statistics
  const { data: flashSaleStats } = useQuery({
    queryKey: ['flash-sale-stats'],
    queryFn: async () => {
      // Total flash sales available (active)
      const { data: availableFlashSales } = await supabase
        .from('flash_sales')
        .select('id')
        .eq('is_active', true);

      // Get all flash sale items with their sales data
      const { data: flashSaleItems } = await supabase
        .from('flash_sale_items')
        .select(`
          *,
          flash_sales!inner(is_active),
          products(name, selling_price)
        `)
        .eq('flash_sales.is_active', true);

      // Calculate total available value (stock_quantity * sale_price)
      const totalAvailableValue = flashSaleItems?.reduce((sum, item) => 
        sum + (item.stock_quantity * item.sale_price), 0) || 0;

      // Calculate total sales value (sold_quantity * sale_price)
      const totalSalesValue = flashSaleItems?.reduce((sum, item) => 
        sum + (item.sold_quantity * item.sale_price), 0) || 0;

      return {
        totalAvailable: availableFlashSales?.length || 0,
        totalAvailableValue,
        totalSalesValue
      };
    }
  });

  const { data: flashSales, isLoading } = useQuery({
    queryKey: ['flash-sales', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items(
            *,
            products(name, selling_price)
          )
        `);
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createFlashSale = useMutation({
    mutationFn: async (data: any) => {
      if (editFlashSale) {
        const { error } = await supabase
          .from('flash_sales')
          .update(data)
          .eq('id', editFlashSale.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('flash_sales')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale-stats'] });
      setOpen(false);
      resetForm();
      toast({ 
        title: 'Berhasil', 
        description: editFlashSale ? 'Flash sale berhasil diperbarui' : 'Flash sale berhasil dibuat' 
      });
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
      queryClient.invalidateQueries({ queryKey: ['flash-sale-stats'] });
      toast({ title: 'Berhasil', description: 'Flash sale berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const addProductToFlashSale = useMutation({
    mutationFn: async ({ flashSaleId, product }: { flashSaleId: string, product: any }) => {
      // Calculate discount (default 10%)
      const discountPercentage = 10;
      const salePrice = product.selling_price * (1 - discountPercentage / 100);
      
      const { error } = await supabase
        .from('flash_sale_items')
        .insert([{
          flash_sale_id: flashSaleId,
          product_id: product.id,
          original_price: product.selling_price,
          sale_price: salePrice,
          discount_percentage: discountPercentage,
          stock_quantity: Math.min(product.current_stock, 50), // Default max 50 items
          max_quantity_per_customer: 5,
          sold_quantity: 0
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale-stats'] });
      toast({ 
        title: 'Berhasil', 
        description: 'Produk berhasil ditambahkan ke flash sale' 
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleEdit = (flashSale: any) => {
    setEditFlashSale(flashSale);
    setFlashSaleData({
      name: flashSale.name,
      description: flashSale.description || '',
      start_date: new Date(flashSale.start_date).toISOString().slice(0, 16),
      end_date: new Date(flashSale.end_date).toISOString().slice(0, 16),
      is_active: flashSale.is_active
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditFlashSale(null);
    setFlashSaleData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      is_active: true
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createFlashSale.mutate({
      ...flashSaleData,
      start_date: new Date(flashSaleData.start_date).toISOString(),
      end_date: new Date(flashSaleData.end_date).toISOString()
    });
  };

  const handleAddProduct = (flashSale: any) => {
    setSelectedFlashSale(flashSale);
    setShowProductSearch(true);
  };

  const handleSelectProduct = (product: any) => {
    if (selectedFlashSale) {
      addProductToFlashSale.mutate({
        flashSaleId: selectedFlashSale.id,
        product
      });
    }
  };

  const getFlashSaleStatus = (flashSale: any) => {
    const now = new Date();
    const startDate = new Date(flashSale.start_date);
    const endDate = new Date(flashSale.end_date);

    if (!flashSale.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    } else if (now < startDate) {
      return <Badge className="bg-blue-600">Upcoming</Badge>;
    } else if (now >= startDate && now <= endDate) {
      return <Badge className="bg-green-600">Active</Badge>;
    } else {
      return <Badge className="bg-gray-600">Expired</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Flash Sales</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Flash Sale
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editFlashSale ? 'Edit Flash Sale' : 'Tambah Flash Sale Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Flash Sale *</Label>
                  <Input
                    id="name"
                    value={flashSaleData.name}
                    onChange={(e) => setFlashSaleData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Weekend Sale"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={flashSaleData.description}
                    onChange={(e) => setFlashSaleData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Diskon besar-besaran untuk akhir pekan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Tanggal Mulai *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={flashSaleData.start_date}
                      onChange={(e) => setFlashSaleData(prev => ({ ...prev, start_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Tanggal Berakhir *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={flashSaleData.end_date}
                      onChange={(e) => setFlashSaleData(prev => ({ ...prev, end_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={flashSaleData.is_active}
                    onCheckedChange={(checked) => setFlashSaleData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={!flashSaleData.name || !flashSaleData.start_date || !flashSaleData.end_date}>
                    {editFlashSale ? 'Update Flash Sale' : 'Tambah Flash Sale'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flash Sales Available</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {flashSaleStats?.totalAvailable || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(flashSaleStats?.totalAvailableValue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Flash Sale Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(flashSaleStats?.totalSalesValue || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari nama flash sale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : flashSales?.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada flash sale</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flashSales?.map((flashSale) => (
                  <TableRow key={flashSale.id}>
                    <TableCell className="font-medium">{flashSale.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{flashSale.description || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(flashSale.start_date).toLocaleDateString('id-ID')}</div>
                        <div className="text-gray-500">sampai</div>
                        <div>{new Date(flashSale.end_date).toLocaleDateString('id-ID')}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getFlashSaleStatus(flashSale)}</TableCell>
                    <TableCell>{flashSale.flash_sale_items?.length || 0} items</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddProduct(flashSale)}
                          title="Tambah Produk"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(flashSale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteFlashSale.mutate(flashSale.id)}
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

        {/* Product Search Modal */}
        <ProductSearchModal
          open={showProductSearch}
          onOpenChange={setShowProductSearch}
          onSelectProduct={handleSelectProduct}
          flashSaleId={selectedFlashSale?.id}
        />
      </div>
    </Layout>
  );
};

export default FlashSales;
