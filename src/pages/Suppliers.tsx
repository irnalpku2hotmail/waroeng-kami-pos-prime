
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, UserCheck, Phone, Mail, MapPin, Search } from 'lucide-react';
import SupplierDetails from '@/components/SupplierDetails';
import SupplierForm from '@/components/SupplierForm';

const Suppliers = () => {
  const [open, setOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Query for suppliers active this month (who made purchases)
  const { data: activeThisMonth } = useQuery({
    queryKey: ['suppliers-active-this-month'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('purchases')
        .select('supplier_id')
        .gte('created_at', startOfMonth.toISOString());

      if (error) throw error;
      
      // Count unique suppliers
      const uniqueSuppliers = new Set(data?.map(p => p.supplier_id) || []);
      return uniqueSuppliers.size;
    }
  });

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

  const handleCloseDialog = () => {
    setOpen(false);
    setEditSupplier(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-800" />
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Manajemen Supplier</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Supplier</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Supplier yang terdaftar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Bulan Ini</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeThisMonth || 0}</div>
              <p className="text-xs text-muted-foreground">
                Supplier dengan transaksi pembelian
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditSupplier(null)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>
                  {editSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                </DialogTitle>
              </DialogHeader>
              <SupplierForm 
                supplier={editSupplier}
                onSuccess={handleCloseDialog}
                onClose={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Suppliers List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daftar Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-500">Memuat data supplier...</p>
              </div>
            ) : suppliers?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Belum ada supplier</p>
                <p className="text-sm">Tambahkan supplier pertama untuk memulai</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kontak Person</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tanggal Dibuat</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers?.map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell>
                            <div 
                              className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setDetailsOpen(true);
                              }}
                            >
                              {supplier.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {supplier.contact_person && (
                                <>
                                  <Users className="h-4 w-4 text-gray-400" />
                                  {supplier.contact_person}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {supplier.phone && (
                                <>
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  {supplier.phone}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {supplier.email && (
                                <>
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  {supplier.email}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(supplier.created_at).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditSupplier(supplier);
                                  setOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteSupplier.mutate(supplier.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {suppliers?.map((supplier) => (
                    <Card key={supplier.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div 
                            className="font-medium text-lg cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setDetailsOpen(true);
                            }}
                          >
                            {supplier.name}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditSupplier(supplier);
                                setOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSupplier.mutate(supplier.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {supplier.contact_person && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Kontak:</span>
                              <span>{supplier.contact_person}</span>
                            </div>
                          )}
                          
                          {supplier.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Telepon:</span>
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          
                          {supplier.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Email:</span>
                              <span>{supplier.email}</span>
                            </div>
                          )}
                          
                          {supplier.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <span className="text-gray-600">Alamat:</span>
                                <p className="text-gray-800">{supplier.address}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 pt-2 border-t">
                            Dibuat: {new Date(supplier.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Supplier Details Modal */}
        <SupplierDetails
          supplier={selectedSupplier}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </div>
    </Layout>
  );
};

export default Suppliers;
