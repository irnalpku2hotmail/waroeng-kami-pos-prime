
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import SupplierDetails from '@/components/SupplierDetails';
import { Plus, Edit, Trash2, User, Building, TrendingUp, DollarSign } from 'lucide-react';

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      let query = supabase.from('suppliers').select('*');
      
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch suppliers active this month
  const { data: activeSuppliers } = useQuery({
    queryKey: ['active-suppliers-this-month'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('purchases')
        .select('supplier_id')
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;
      
      // Get unique supplier IDs
      const uniqueSupplierIds = [...new Set(data.map(p => p.supplier_id))];
      return uniqueSupplierIds.length;
    }
  });

  const saveSupplier = useMutation({
    mutationFn: async (supplierData: any) => {
      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingSupplier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('suppliers').insert(supplierData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['active-suppliers-this-month'] });
      toast({
        title: 'Berhasil',
        description: `Supplier berhasil ${editingSupplier ? 'diperbarui' : 'ditambahkan'}`,
      });
      handleCloseForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Gagal ${editingSupplier ? 'memperbarui' : 'menambahkan'} supplier`,
        variant: 'destructive',
      });
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['active-suppliers-this-month'] });
      toast({ title: 'Berhasil', description: 'Supplier berhasil dihapus' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Gagal menghapus supplier',
        variant: 'destructive',
      });
    },
  });

  const stats = useMemo(() => {
    const totalSuppliers = suppliers?.length || 0;
    const activeSuppliersThisMonth = activeSuppliers || 0;

    return {
      totalSuppliers,
      activeSuppliersThisMonth
    };
  }, [suppliers, activeSuppliers]);

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupplier.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus supplier ini?')) {
      deleteSupplier.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">
              Kelola informasi supplier dan vendor Anda
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tambah Supplier
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
              <p className="text-xs text-muted-foreground">supplier terdaftar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suppliers Aktif Bulan Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSuppliersThisMonth}</div>
              <p className="text-xs text-muted-foreground">supplier dengan transaksi</p>
            </CardContent>
          </Card>
        </div>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Suppliers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Cari supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : suppliers && suppliers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Supplier</TableHead>
                    <TableHead>Kontak Person</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[150px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                          onClick={() => setSelectedSupplier(supplier)}
                        >
                          {supplier.name}
                        </Button>
                      </TableCell>
                      <TableCell>{supplier.contact_person || '-'}</TableCell>
                      <TableCell>{supplier.phone || '-'}</TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum ada supplier</h3>
                <p className="text-gray-600 mb-4">
                  Mulai dengan menambahkan supplier pertama Anda
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Supplier
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Supplier Form */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Supplier *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama supplier"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Kontak Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Nama kontak person"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Nomor telepon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email supplier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Alamat lengkap supplier"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  Batal
                </Button>
                <Button type="submit" disabled={saveSupplier.isPending}>
                  {saveSupplier.isPending ? 'Menyimpan...' : editingSupplier ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Supplier Details Modal */}
        {selectedSupplier && (
          <SupplierDetails
            supplier={selectedSupplier}
            open={!!selectedSupplier}
            onOpenChange={() => setSelectedSupplier(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Suppliers;
