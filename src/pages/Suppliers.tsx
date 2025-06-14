import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building2, Eye, Users, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import SupplierDetails from '@/components/SupplierDetails';

const Suppliers = () => {
  const [open, setOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const [supplierData, setSupplierData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });

  // Fetch supplier statistics
  const { data: supplierStats } = useQuery({
    queryKey: ['supplier-stats'],
    queryFn: async () => {
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
      
      // Total suppliers
      const { data: totalSuppliers } = await supabase
        .from('suppliers')
        .select('id');
      
      // Active suppliers this month (suppliers with purchases this month)
      const { data: activeSuppliersThisMonth } = await supabase
        .from('purchases')
        .select('supplier_id')
        .gte('created_at', firstDayOfMonth);
      
      const uniqueActiveSuppliers = new Set(activeSuppliersThisMonth?.map(p => p.supplier_id) || []);
      
      return {
        totalSuppliers: totalSuppliers?.length || 0,
        activeSuppliersThisMonth: uniqueActiveSuppliers.size
      };
    }
  });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select('*');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createSupplier = useMutation({
    mutationFn: async (data: any) => {
      if (editSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(data)
          .eq('id', editSupplier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
      setOpen(false);
      resetForm();
      toast({ 
        title: 'Berhasil', 
        description: editSupplier ? 'Supplier berhasil diperbarui' : 'Supplier berhasil dibuat' 
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] });
      toast({ title: 'Berhasil', description: 'Supplier berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleEdit = (supplier: any) => {
    setEditSupplier(supplier);
    setSupplierData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditSupplier(null);
    setSupplierData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createSupplier.mutate(supplierData);
  };

  const openSupplierDetails = (supplier: any) => {
    setSelectedSupplier(supplier);
    setShowDetailsDialog(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Suppliers</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Supplier *</Label>
                  <Input
                    id="name"
                    value={supplierData.name}
                    onChange={(e) => setSupplierData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="PT. Supplier ABC"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Kontak Person</Label>
                  <Input
                    id="contact_person"
                    value={supplierData.contact_person}
                    onChange={(e) => setSupplierData(prev => ({ ...prev, contact_person: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                      id="phone"
                      value={supplierData.phone}
                      onChange={(e) => setSupplierData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="08123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={supplierData.email}
                      onChange={(e) => setSupplierData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="supplier@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    value={supplierData.address}
                    onChange={(e) => setSupplierData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Alamat lengkap supplier"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={!supplierData.name}>
                    {editSupplier ? 'Update Supplier' : 'Tambah Supplier'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {supplierStats?.totalSuppliers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {supplierStats?.activeSuppliersThisMonth || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari nama, kontak person, email, atau telepon supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : suppliers?.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada supplier</p>
            </div>
          ) : (
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
                {suppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact_person || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{supplier.address || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSupplierDetails(supplier)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(supplier)}
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
          )}
        </div>

        {/* Supplier Details Dialog */}
        <SupplierDetails
          supplier={selectedSupplier}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      </div>
    </Layout>
  );
};

export default Suppliers;
