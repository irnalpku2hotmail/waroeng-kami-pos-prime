
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Users, TrendingUp, Package } from 'lucide-react';
import Layout from '@/components/Layout';
import SupplierDetails from '@/components/SupplierDetails';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

const Suppliers = () => {
  const [open, setOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const [supplierData, setSupplierData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', searchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['suppliers-stats'],
    queryFn: async () => {
      const [suppliersCount, purchasesCount] = await Promise.all([
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
        supabase.from('purchases').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalSuppliers: suppliersCount.count || 0,
        totalPurchases: purchasesCount.count || 0
      };
    }
  });

  const suppliers = suppliersData?.data || [];
  const suppliersCount = suppliersData?.count || 0;
  const totalPages = Math.ceil(suppliersCount / ITEMS_PER_PAGE);

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
      queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] });
      setOpen(false);
      resetForm();
      toast({ 
        title: 'Berhasil', 
        description: editSupplier ? 'Supplier berhasil diperbarui' : 'Supplier berhasil ditambahkan'
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
      queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] });
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
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    });
    setOpen(true);
  };

  const handleDetails = (supplier: any) => {
    setSelectedSupplier(supplier);
    setDetailsOpen(true);
  };

  const resetForm = () => {
    setEditSupplier(null);
    setSupplierData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createSupplier.mutate(supplierData);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Supplier</h1>
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
                    placeholder="PT. Supplier Indonesia"
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={supplierData.email}
                    onChange={(e) => setSupplierData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="supplier@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={supplierData.phone}
                    onChange={(e) => setSupplierData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+62 812 3456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    value={supplierData.address}
                    onChange={(e) => setSupplierData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Jl. Supplier No. 123, Jakarta"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={!supplierData.name}>
                    {editSupplier ? 'Update' : 'Simpan'}
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
              <CardTitle className="text-sm font-medium">Total Supplier</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalSuppliers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalPurchases || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari supplier..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : suppliers?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada supplier</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contact_person || '-'}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDetails(supplier)}
                        >
                          Detail
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
          
          {totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={suppliersCount}
            />
          )}
        </div>
      </div>
      
      {selectedSupplier && (
        <SupplierDetails
          supplier={selectedSupplier}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </Layout>
  );
};

export default Suppliers;
