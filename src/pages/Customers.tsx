
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users, Eye, Download, Award, DollarSign } from 'lucide-react';
import Layout from '@/components/Layout';
import CustomerDetails from '@/components/CustomerDetails';
import PaginationComponent from '@/components/PaginationComponent';
import { exportToExcel } from '@/utils/excelExport';

const ITEMS_PER_PAGE = 10;

const Customers = () => {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Query for all customers for export and stats
  const { data: allCustomersData } = useQuery({
    queryKey: ['all-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const totalCustomers = allCustomersData?.length || 0;
  const totalPoints = allCustomersData?.reduce((sum, customer) => sum + (customer.total_points || 0), 0) || 0;
  const totalSpent = allCustomersData?.reduce((sum, customer) => sum + (customer.total_spent || 0), 0) || 0;

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', searchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase.from('customers').select('*', { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%`);
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

  const createCustomer = useMutation({
    mutationFn: async (customer: any) => {
      const { error } = await supabase.from('customers').insert([customer]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setOpen(false);
      toast({ title: 'Berhasil', description: 'Customer berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...customer }: any) => {
      const { error } = await supabase.from('customers').update(customer).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setOpen(false);
      setEditCustomer(null);
      toast({ title: 'Berhasil', description: 'Customer berhasil diupdate' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Berhasil', description: 'Customer berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const customerData = {
      customer_code: formData.get('customer_code') as string,
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };

    if (editCustomer) {
      updateCustomer.mutate({ id: editCustomer.id, ...customerData });
    } else {
      createCustomer.mutate(customerData);
    }
  };

  const handleExportToExcel = () => {
    if (!allCustomersData || allCustomersData.length === 0) {
      toast({ title: 'Warning', description: 'Tidak ada data untuk diekspor', variant: 'destructive' });
      return;
    }

    const exportData = allCustomersData.map(customer => ({
      'Kode Customer': customer.customer_code,
      'Nama Customer': customer.name,
      'Telepon': customer.phone || '-',
      'Email': customer.email || '-',
      'Alamat': customer.address || '-',
      'Total Poin': customer.total_points,
      'Total Belanja': customer.total_spent,
      'Tanggal Bergabung': new Date(customer.created_at).toLocaleDateString('id-ID')
    }));

    exportToExcel(exportData, 'Data_Customer', 'Customer');
    toast({ title: 'Berhasil', description: 'Data berhasil diekspor ke Excel' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Customer</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditCustomer(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editCustomer ? 'Edit Customer' : 'Tambah Customer Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCustomerSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_code">Kode Customer *</Label>
                    <Input
                      id="customer_code"
                      name="customer_code"
                      defaultValue={editCustomer?.customer_code}
                      placeholder="Contoh: C001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Customer *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editCustomer?.name}
                      placeholder="Contoh: John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={editCustomer?.phone}
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={editCustomer?.address}
                      placeholder="Contoh: Jl. Pahlawan No. 1"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">
                      {editCustomer ? 'Update' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Poin</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Belanja</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {totalSpent.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari nama, telepon, atau kode customer..."
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
          ) : customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada customer</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Customer</TableHead>
                    <TableHead>Nama Customer</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.customer_code}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customer.address || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditCustomer(customer);
                              setOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCustomer.mutate(customer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
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
                totalItems={customersCount}
              />
            </>
          )}
        </div>
      </div>
      {selectedCustomer && (
        <CustomerDetails 
          customer={selectedCustomer} 
          open={detailOpen} 
          onOpenChange={setDetailOpen}
        />
      )}
    </Layout>
  );
};

export default Customers;
