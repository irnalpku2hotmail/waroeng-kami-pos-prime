
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';
import Layout from '@/components/Layout';
import FlashSaleDetailsModal from '@/components/FlashSaleDetailsModal';

const FlashSales = () => {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editFlashSale, setEditFlashSale] = useState<any>(null);
  const [selectedFlashSale, setSelectedFlashSale] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: flashSales = [], isLoading } = useQuery({
    queryKey: ['flash-sales', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items(
            id,
            stock_quantity,
            sold_quantity
          )
        `);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createFlashSale = useMutation({
    mutationFn: async (flashSale: any) => {
      const { error } = await supabase.from('flash_sales').insert([flashSale]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      setOpen(false);
      toast({ title: 'Berhasil', description: 'Flash sale berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateFlashSale = useMutation({
    mutationFn: async ({ id, ...flashSale }: any) => {
      const { error } = await supabase.from('flash_sales').update(flashSale).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      setOpen(false);
      setEditFlashSale(null);
      toast({ title: 'Berhasil', description: 'Flash sale berhasil diupdate' });
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

  const handleFlashSaleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const flashSaleData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      is_active: formData.get('is_active') === 'on',
    };

    if (editFlashSale) {
      updateFlashSale.mutate({ id: editFlashSale.id, ...flashSaleData });
    } else {
      createFlashSale.mutate(flashSaleData);
    }
  };

  const getFlashSaleStatus = (flashSale: any) => {
    if (!flashSale.is_active) return { label: 'Nonaktif', variant: 'secondary' as const };
    
    const now = new Date();
    const startDate = new Date(flashSale.start_date);
    const endDate = new Date(flashSale.end_date);
    
    if (now < startDate) return { label: 'Akan Datang', variant: 'outline' as const };
    if (now > endDate) return { label: 'Berakhir', variant: 'destructive' as const };
    return { label: 'Berlangsung', variant: 'default' as const };
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Flash Sales</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditFlashSale(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Flash Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editFlashSale ? 'Edit Flash Sale' : 'Tambah Flash Sale Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFlashSaleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Flash Sale *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editFlashSale?.name}
                    placeholder="Contoh: Flash Sale Akhir Tahun"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editFlashSale?.description}
                    placeholder="Deskripsi flash sale"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Tanggal Mulai *</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="datetime-local"
                      defaultValue={editFlashSale?.start_date ? new Date(editFlashSale.start_date).toISOString().slice(0, 16) : ''}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Tanggal Berakhir *</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="datetime-local"
                      defaultValue={editFlashSale?.end_date ? new Date(editFlashSale.end_date).toISOString().slice(0, 16) : ''}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editFlashSale?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Status Aktif</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {editFlashSale ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari flash sale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : flashSales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Belum ada flash sale</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Flash Sale</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flashSales.map((flashSale) => {
                  const status = getFlashSaleStatus(flashSale);
                  return (
                    <TableRow key={flashSale.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{flashSale.name}</div>
                          {flashSale.description && (
                            <div className="text-sm text-gray-500">{flashSale.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(flashSale.start_date).toLocaleDateString('id-ID')}</div>
                          <div className="text-gray-500">
                            s/d {new Date(flashSale.end_date).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{flashSale.flash_sale_items?.length || 0} item</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditFlashSale(flashSale);
                              setOpen(true);
                            }}
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedFlashSale(flashSale);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
    </Layout>
  );
};

export default FlashSales;
