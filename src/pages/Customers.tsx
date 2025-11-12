
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Gift, Star, Edit, Trash2, Search, UserPlus } from 'lucide-react';
import Layout from '@/components/Layout';
import CustomerDetails from '@/components/CustomerDetails';
import CustomerForm from '@/components/CustomerForm';
import PaginationComponent from '@/components/PaginationComponent';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ITEMS_PER_PAGE = 10;

const Customers = () => {
  const [open, setOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const queryClient = useQueryClient();


  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', searchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('customers')
        .select(`
          id,
          name,
          email,
          phone,
          address,
          date_of_birth,
          total_points,
          total_spent,
          created_at,
          updated_at
        `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    }
  });

  const customers = customersData?.data || [];
  const customersCount = customersData?.count || 0;
  const totalPages = Math.ceil(customersCount / ITEMS_PER_PAGE);


  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Berhasil', description: 'Customer berhasil dihapus' });
      setDeleteCustomerId(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setDeleteCustomerId(null);
    }
  });

  const handleCloseDialog = () => {
    setOpen(false);
    setEditCustomer(null);
  };

  const handleEditCustomer = (customer: any) => {
    setEditCustomer(customer);
    setOpen(true);
  };

  const handleDeleteCustomer = (id: string) => {
    setDeleteCustomerId(id);
  };

  const confirmDelete = () => {
    if (deleteCustomerId) {
      deleteCustomer.mutate(deleteCustomerId);
    }
  };

  const handleViewDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setDetailModalOpen(true);
  };

  const totalCustomers = customers.length;
  const totalPoints = customers.reduce((sum, c) => sum + c.total_points, 0);
  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);

  return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Manajemen Customer</h1>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditCustomer(null)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Tambah Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editCustomer ? 'Edit Customer' : 'Tambah Customer Baru'}
                  </DialogTitle>
                </DialogHeader>
                <CustomerForm customer={editCustomer} onSuccess={handleCloseDialog} />
              </DialogContent>
            </Dialog>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customer</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {totalSpent.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata per Customer</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {totalCustomers > 0 ? (totalSpent / totalCustomers).toLocaleString('id-ID') : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Tidak ada data customer
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Lahir</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poin</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Belanja</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {customer.email || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {customer.phone || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Badge className="bg-blue-100 text-blue-800">
                            {customer.total_points} poin
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          Rp {customer.total_spent.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetail(customer)}
                            >
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCustomer(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="border-t px-4 py-3">
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={customersCount}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <CustomerDetails
          customer={selectedCustomer}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
        />

        <AlertDialog open={!!deleteCustomerId} onOpenChange={(open) => !open && setDeleteCustomerId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus customer ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteCustomerId(null)}>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                {deleteCustomer.isPending ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Customers;
