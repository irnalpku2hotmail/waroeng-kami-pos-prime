
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MoreHorizontal, Eye, User } from 'lucide-react';
import Layout from '@/components/Layout';
import CustomerDetails from '@/components/CustomerDetails';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

// Function to generate customer code
const generateCustomerCode = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('customer_code')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error generating customer code:', error);
    return `CUST${Date.now().toString().slice(-6)}`;
  }

  if (!data || data.length === 0) {
    return 'CUST000001';
  }

  const lastCode = data[0].customer_code;
  const match = lastCode.match(/CUST(\d+)/);
  
  if (match) {
    const nextNumber = parseInt(match[1]) + 1;
    return `CUST${nextNumber.toString().padStart(6, '0')}`;
  }

  return `CUST${Date.now().toString().slice(-6)}`;
};

const Customers = () => {
  const [open, setOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    date_of_birth: ''
  });

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', searchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });
      
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

  const saveCustomer = useMutation({
    mutationFn: async (data: any) => {
      // Generate customer code if creating new customer
      if (!editCustomer) {
        data.customer_code = await generateCustomerCode();
      }

      if (editCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(data)
          .eq('id', editCustomer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ 
        title: 'Berhasil', 
        description: editCustomer ? 'Customer berhasil diperbarui' : 'Customer berhasil ditambahkan' 
      });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving customer:', error);
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
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

  const handleCloseDialog = () => {
    setOpen(false);
    setEditCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      date_of_birth: ''
    });
  };

  const handleEdit = (customer: any) => {
    setEditCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      date_of_birth: customer.date_of_birth || ''
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Nama customer harus diisi', 
        variant: 'destructive' 
      });
      return;
    }

    saveCustomer.mutate(formData);
  };

  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Customer</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditCustomer(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editCustomer ? 'Edit Customer' : 'Tambah Customer Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nama lengkap customer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="customer@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Alamat lengkap customer"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={saveCustomer.isPending}>
                    {saveCustomer.isPending ? 'Menyimpan...' : (editCustomer ? 'Update' : 'Simpan')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Customer</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Poin</TableHead>
                <TableHead>Total Belanja</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Belum ada customer</p>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.customer_code}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.total_points}</TableCell>
                    <TableCell>Rp {customer.total_spent.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewDetails(customer)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(customer)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteCustomer.mutate(customer.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={customersCount}
          />
        )}

        {/* Customer Details Dialog */}
        <CustomerDetails 
          customer={selectedCustomer}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </div>
    </Layout>
  );
};

export default Customers;
