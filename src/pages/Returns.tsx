
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, RotateCcw, MoreHorizontal, Eye, CheckCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import ReturnsForm from '@/components/ReturnsForm';
import ReturnDetailModal from '@/components/ReturnDetailModal';

const Returns = () => {
  const [open, setOpen] = useState(false);
  const [editReturn, setEditReturn] = useState<any>(null);
  const [selectedReturnForDetail, setSelectedReturnForDetail] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('returns')
        .select(`
          *,
          suppliers(name),
          profiles(full_name),
          return_items(*,
            products(name)
          )
        `);
      
      if (searchTerm) {
        query = query.or(`return_number.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const deleteReturn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('returns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast({ title: 'Berhasil', description: 'Return berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateReturnStatus = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('returns')
        .update({ status: 'success' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast({ title: 'Berhasil', description: 'Status return berhasil diubah ke Success' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCloseDialog = () => {
    setOpen(false);
    setEditReturn(null);
  };

  const openDetailDialog = (returnData: any) => {
    setSelectedReturnForDetail(returnData);
    setDetailDialogOpen(true);
  };

  const processReturns = returns?.filter(r => r.status === 'process') || [];
  const successReturns = returns?.filter(r => r.status === 'success') || [];

  const ReturnTable = ({ data }: { data: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. Return</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Dibuat oleh</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((returnItem) => (
          <TableRow key={returnItem.id}>
            <TableCell className="font-medium">{returnItem.return_number}</TableCell>
            <TableCell>{returnItem.invoice_number || '-'}</TableCell>
            <TableCell>{returnItem.suppliers?.name || '-'}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                returnItem.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {returnItem.status === 'success' ? 'Success' : 'Process'}
              </span>
            </TableCell>
            <TableCell>Rp {returnItem.total_amount?.toLocaleString('id-ID')}</TableCell>
            <TableCell>
              {new Date(returnItem.return_date).toLocaleDateString('id-ID')}
            </TableCell>
            <TableCell>{returnItem.profiles?.full_name || 'Unknown'}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => openDetailDialog(returnItem)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Detail
                  </DropdownMenuItem>
                  {returnItem.status === 'process' && (
                    <DropdownMenuItem
                      onClick={() => updateReturnStatus.mutate(returnItem.id)}
                      className="text-green-600 focus:text-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
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
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Return</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditReturn(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Return
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editReturn ? 'Edit Return' : 'Tambah Return Baru'}</DialogTitle>
              </DialogHeader>
              <ReturnsForm 
                returnData={editReturn}
                onSuccess={handleCloseDialog}
                onCancel={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari nomor return atau invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Tabs defaultValue="process" className="w-full">
          <TabsList>
            <TabsTrigger value="process">Process ({processReturns.length})</TabsTrigger>
            <TabsTrigger value="history">History ({successReturns.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="process">
            <div className="border rounded-lg">
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : processReturns.length === 0 ? (
                <div className="text-center py-8">
                  <RotateCcw className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Belum ada return dalam proses</p>
                </div>
              ) : (
                <ReturnTable data={processReturns} />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="border rounded-lg">
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : successReturns.length === 0 ? (
                <div className="text-center py-8">
                  <RotateCcw className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Belum ada return yang selesai</p>
                </div>
              ) : (
                <ReturnTable data={successReturns} />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Return Detail Dialog */}
        <ReturnDetailModal
          returnData={selectedReturnForDetail}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </div>
    </Layout>
  );
};

export default Returns;
