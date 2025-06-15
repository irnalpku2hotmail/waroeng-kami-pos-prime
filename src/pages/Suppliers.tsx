import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building2, Phone, Mail, User, Download, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import PaginationComponent from '@/components/PaginationComponent';
import { exportToExcel } from '@/utils/excelExport';
import SupplierDetails from '@/components/SupplierDetails';

const ITEMS_PER_PAGE = 10;

const Suppliers = () => {
  const [open, setOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Query for supplier statistics
  const { data: supplierStats } = useQuery({
    queryKey: ['supplier-stats'],
    queryFn: async () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();

      // Total suppliers
      const { data: totalSuppliers, error: totalError } = await supabase
        .from('suppliers')
        .select('id', { count: 'exact' });

      if (totalError) throw totalError;

      // Active suppliers this month (suppliers with purchases this month)
      const { data: monthlyActiveSuppliers, error: monthlyError } = await supabase
        .from('purchases')
        .select('supplier_id', { count: 'exact' })
        .gte('created_at', startOfMonth);

      if (monthlyError) throw monthlyError;

      // Active suppliers this year (suppliers with purchases this year)
      const { data: yearlyActiveSuppliers, error: yearlyError } = await supabase
        .from('purchases')
        .select('supplier_id', { count: 'exact' })
        .gte('created_at', startOfYear);

      if (yearlyError) throw yearlyError;

      return {
        totalSuppliers: totalSuppliers?.length || 0,
        monthlyActiveSuppliers: new Set(monthlyActiveSuppliers?.map(p => p.supplier_id)).size || 0,
        yearlyActiveSuppliers: new Set(yearlyActiveSuppliers?.map(p => p.supplier_id)).size || 0
      };
    }
  });

  // Query for all suppliers for export
  const { data: allSuppliersData } = useQuery({
    queryKey: ['all-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      return data;
    }
  });

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', searchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase.from('suppliers').select('*', { count: 'exact' });
      
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      
      const { data, error, count } = await query
        .order('name', { ascending: true })
        .range(from, to);
        
      if (error) throw error;
      return { data, count };
    }
  });

  const suppliers = suppliersData?.data || [];
  const suppliersCount = suppliersData?.count || 0;
  const totalPages = Math.ceil(suppliersCount / ITEMS_PER_PAGE);

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Berhasil', description: 'Supplier berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: any) => {
      const { error } = await supabase.from('suppliers').insert([supplier]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      toast({ title: 'Berhasil', description: 'Supplier berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...supplier }: any) => {
      const { error } = await supabase.from('suppliers').update(supplier).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      setEditSupplier(null);
      toast({ title: 'Berhasil', description: 'Supplier berhasil diupdate' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCloseDialog = () => {
    setOpen(false);
    setEditSupplier(null);
  };

  const handleSupplierSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const supplierData = {
      name: formData.get('name') as string,
      contact_person: formData.get('contact_person') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      address: formData.get('address') as string,
    };

    if (editSupplier) {
      updateSupplier.mutate({ id: editSupplier.id, ...supplierData });
    } else {
      createSupplier.mutate(supplierData);
    }
  };

  const handleExportToExcel = () => {
    if (!allSuppliersData || allSuppliersData.length === 0) {
      toast({ title: 'Warning', description: 'Tidak ada data untuk diekspor', variant: 'destructive' });
      return;
    }

    const exportData = allSuppliersData.map(supplier => ({
      'Nama Supplier': supplier.name,
      'Kontak Person': supplier.contact_person || '-',
      'Telepon': supplier.phone || '-',
      'Email': supplier.email || '-',
      'Alamat': supplier.address || '-',
      'Tanggal Dibuat': new Date(supplier.created_at).toLocaleDateString('id-ID')
    }));

    exportToExcel(exportData, 'Data_Supplier', 'Supplier');
    toast({ title: 'Berhasil', description: 'Data berhasil diekspor ke Excel' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Supplier</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditSupplier(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSupplierSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Supplier *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editSupplier?.name}
                      placeholder="Contoh: PT. Maju Jaya"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Kontak Person *</Label>
                    <Input
                      id="contact_person"
                      name="contact_person"
                      defaultValue={editSupplier?.contact_person}
                      placeholder="Contoh: John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telepon *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={editSupplier?.phone}
                      placeholder="Contoh: 081234567890"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editSupplier?.email}
                      placeholder="Contoh: john.doe@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      name="address"
                      defaultValue={editSupplier?.address}
                      placeholder="Contoh: Jl. Pahlawan No. 1"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">
                      {editSupplier ? 'Update' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Supplier Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-2">
              <CardTitle className="text-sm font-medium">Total Supplier</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {supplierStats?.totalSuppliers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Supplier terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-2">
              <CardTitle className="text-sm font-medium">Supplier Aktif Bulan Ini</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {supplierStats?.monthlyActiveSuppliers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Dengan transaksi bulan ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-2">
              <CardTitle className="text-sm font-medium">Supplier Aktif Tahun Ini</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {supplierStats?.yearlyActiveSuppliers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Dengan transaksi tahun ini</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari supplier..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada supplier</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Supplier</TableHead>
                    <TableHead>Kontak Person</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_person}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>{supplier.address || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditSupplier(supplier);
                              setOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteSupplier.mutate(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationComponent 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={suppliersCount}
              />
            </>
          )}
        </div>
      </div>
      <SupplierDetails
        supplier={selectedSupplier}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </Layout>
  );
};

export default Suppliers;
