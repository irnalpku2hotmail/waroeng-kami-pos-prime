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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Zap, Calendar, DollarSign, TrendingUp, Package, Search, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import FlashSaleItemsManager from '@/components/FlashSaleItemsManager';
import FlashSaleDetailsModal from '@/components/FlashSaleDetailsModal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

const FlashSales = () => {
  const [open, setOpen] = useState(false);
  const [editFlashSale, setEditFlashSale] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedFlashSale, setSelectedFlashSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteFlashSaleId, setDeleteFlashSaleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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

  const { data: flashSalesData, isLoading } = useQuery({
    queryKey: ['flash-sales', searchTerm, statusFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      let query = supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items(
            *,
            products(name, selling_price)
          )
        `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        const now = new Date().toISOString();
        
        if (statusFilter === 'active') {
          query = query
            .eq('is_active', true)
            .lte('start_date', now)
            .gte('end_date', now);
        } else if (statusFilter === 'upcoming') {
          query = query
            .eq('is_active', true)
            .gt('start_date', now);
        } else if (statusFilter === 'expired') {
          query = query.lt('end_date', now);
        } else if (statusFilter === 'inactive') {
          query = query.eq('is_active', false);
        }
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data, count };
    }
  });

  const flashSales = flashSalesData?.data || [];
  const flashSalesCount = flashSalesData?.count || 0;
  const totalPages = Math.ceil(flashSalesCount / ITEMS_PER_PAGE);

  const createFlashSale = useMutation({
    mutationFn: async (data: any) => {
      if (editFlashSale) {
        const { error } = await supabase
          .from('flash_sales')
          .update(data)
          .eq('id', editFlashSale.id);
        if (error) throw error;
        return { id: editFlashSale.id };
      } else {
        const { data: result, error } = await supabase
          .from('flash_sales')
          .insert([data])
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['flash-sale-stats'] });
      
      // If creating a new flash sale, keep the dialog open and switch to items tab
      if (!editFlashSale && result) {
        setEditFlashSale(result);
        toast({ 
          title: 'Berhasil', 
          description: 'Flash sale berhasil dibuat. Sekarang tambahkan produk.'
        });
      } else {
        setOpen(false);
        resetForm();
        toast({ 
          title: 'Berhasil', 
          description: 'Flash sale berhasil diperbarui'
        });
      }
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
      setDeleteFlashSaleId(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setDeleteFlashSaleId(null);
    }
  });

  const handleDeleteFlashSale = (id: string) => {
    setDeleteFlashSaleId(id);
  };

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

  const handleDetails = (flashSale: any) => {
    setSelectedFlashSale(flashSale);
    setDetailOpen(true);
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>{editFlashSale ? 'Edit Flash Sale' : 'Tambah Flash Sale Baru'}</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                  <TabsTrigger value="items" disabled={!editFlashSale}>
                    Produk ({editFlashSale?.flash_sale_items?.length || 0})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
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
                        {editFlashSale ? 'Update Flash Sale' : 'Simpan & Tambah Produk'}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="items" className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <FlashSaleItemsManager 
                    flashSaleId={editFlashSale?.id}
                    onItemsChange={() => {
                      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
                    }}
                  />
                </TabsContent>
              </Tabs>
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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="upcoming">Akan Datang</SelectItem>
              <SelectItem value="expired">Berakhir</SelectItem>
              <SelectItem value="inactive">Tidak Aktif</SelectItem>
            </SelectContent>
          </Select>
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
                          onClick={() => handleDetails(flashSale)}
                        >
                          <Eye className="h-4 w-4" />
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
                          onClick={() => handleDeleteFlashSale(flashSale.id)}
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
          
          {totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={flashSalesCount}
            />
          )}
        </div>
      </div>
      {selectedFlashSale && (
        <FlashSaleDetailsModal
          flashSale={selectedFlashSale}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}

      <AlertDialog open={deleteFlashSaleId !== null} onOpenChange={(open) => !open && setDeleteFlashSaleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus flash sale ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteFlashSaleId && deleteFlashSale.mutate(deleteFlashSaleId)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default FlashSales;
