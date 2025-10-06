import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MoreHorizontal, Eye, Users } from 'lucide-react';
import CustomerReturnForm from '@/components/CustomerReturnForm';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

const CustomerReturnsTab = () => {
  const [open, setOpen] = useState(false);
  const [editReturn, setEditReturn] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: returnsData, isLoading } = useQuery({
    queryKey: ['customer-returns', searchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      let query = supabase
        .from('customer_returns')
        .select(`
          *,
          customers(name),
          orders(order_number),
          customer_return_items(*,
            products(name)
          )
        `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`return_number.ilike.%${searchTerm}%`);
      }
      
      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
      if (error) throw error;
      return { data, count };
    }
  });

  const returns = returnsData?.data || [];
  const returnsCount = returnsData?.count || 0;
  const totalPages = Math.ceil(returnsCount / ITEMS_PER_PAGE);

  const deleteReturn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_returns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
      toast({ title: 'Berhasil', description: 'Return pelanggan berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateReturnStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('customer_returns')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
      toast({ title: 'Berhasil', description: 'Status return berhasil diubah' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCloseDialog = () => {
    setOpen(false);
    setEditReturn(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Return Pelanggan
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditReturn(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Return Pelanggan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editReturn ? 'Edit Return Pelanggan' : 'Tambah Return Pelanggan Baru'}</DialogTitle>
            </DialogHeader>
            <CustomerReturnForm 
              returnData={editReturn}
              onSuccess={handleCloseDialog}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Cari nomor return..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-lg">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : returns.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Belum ada return pelanggan</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Return</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Diproses oleh</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((returnItem) => (
                <TableRow key={returnItem.id}>
                  <TableCell className="font-medium">{returnItem.return_number}</TableCell>
                  <TableCell>
                    {returnItem.customers?.name}
                  </TableCell>
                  <TableCell>{returnItem.orders?.order_number || '-'}</TableCell>
                  <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                  <TableCell>Rp {returnItem.total_amount?.toLocaleString('id-ID')}</TableCell>
                  <TableCell>
                    {new Date(returnItem.return_date).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell>Staff</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {returnItem.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => updateReturnStatus.mutate({ id: returnItem.id, status: 'approved' })}
                              className="text-blue-600 focus:text-blue-600"
                            >
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateReturnStatus.mutate({ id: returnItem.id, status: 'rejected' })}
                              className="text-red-600 focus:text-red-600"
                            >
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {returnItem.status === 'approved' && (
                          <DropdownMenuItem
                            onClick={() => updateReturnStatus.mutate({ id: returnItem.id, status: 'completed' })}
                            className="text-green-600 focus:text-green-600"
                          >
                            Mark Complete
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setEditReturn(returnItem);
                            setOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteReturn.mutate(returnItem.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      
      {totalPages > 1 && (
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={returnsCount}
        />
      )}
    </div>
  );
};

export default CustomerReturnsTab;