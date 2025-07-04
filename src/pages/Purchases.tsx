
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, Check, CreditCard, MoreHorizontal, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import PurchaseForm from '@/components/PurchaseForm';
import PurchasePaymentForm from '@/components/PurchasePaymentForm';
import PurchaseDetailModal from '@/components/PurchaseDetailModal';
import PurchaseStats from '@/components/purchase/PurchaseStats';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

const Purchases = () => {
  const [open, setOpen] = useState(false);
  const [editPurchase, setEditPurchase] = useState<any>(null);
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPurchaseForDetail, setSelectedPurchaseForDetail] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: purchasesData, isLoading } = useQuery({
    queryKey: ['purchases', searchTerm, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      let query = supabase
        .from('purchases')
        .select(`
          *,
          suppliers(name),
          profiles(full_name),
          purchase_items(*,
            products(name)
          )
        `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`purchase_number.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data, count };
    }
  });

  const purchases = purchasesData?.data || [];
  const purchasesCount = purchasesData?.count || 0;
  const totalPages = Math.ceil(purchasesCount / ITEMS_PER_PAGE);

  const deletePurchase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ title: 'Berhasil', description: 'Pembelian berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const markAsPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('purchases')
        .update({ payment_status: 'paid' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast({ title: 'Berhasil', description: 'Pembelian berhasil ditandai sebagai lunas' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleCloseDialog = () => {
    setOpen(false);
    setEditPurchase(null);
  };

  const openPaymentDialog = (purchase: any) => {
    setSelectedPurchaseForPayment(purchase);
    setPaymentDialogOpen(true);
  };

  const openDetailDialog = (purchase: any) => {
    setSelectedPurchaseForDetail(purchase);
    setDetailDialogOpen(true);
  };

  const getPaymentStatus = (purchase: any) => {
    switch (purchase.payment_status) {
      case 'paid':
        return <Badge className="bg-green-600">Lunas</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-600">Sebagian</Badge>;
      case 'unpaid':
        const isOverdue = purchase.due_date && new Date(purchase.due_date) < new Date();
        return <Badge className={isOverdue ? 'bg-red-600' : 'bg-orange-600'}>
          {isOverdue ? 'Overdue' : 'Belum Lunas'}
        </Badge>;
      default:
        return <Badge className="bg-gray-600">Unknown</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Pembelian</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditPurchase(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pembelian
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle>
              </DialogHeader>
              <PurchaseForm 
                purchase={editPurchase}
                onSuccess={handleCloseDialog}
                onCancel={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </div>

        <PurchaseStats />

        <div className="flex gap-4">
          <Input
            placeholder="Cari nomor pembelian atau invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : purchases?.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada pembelian</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pembelian</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Dibuat oleh</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases?.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                    <TableCell>{purchase.invoice_number || '-'}</TableCell>
                    <TableCell>{purchase.suppliers?.name || '-'}</TableCell>
                    <TableCell>{getPaymentStatus(purchase)}</TableCell>
                    <TableCell>Rp {purchase.total_amount?.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      {new Date(purchase.purchase_date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('id-ID') : '-'}
                    </TableCell>
                    <TableCell>{purchase.profiles?.full_name || 'Unknown'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openDetailDialog(purchase)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </DropdownMenuItem>
                          {purchase.payment_status !== 'paid' && (
                            <>
                              <DropdownMenuItem onClick={() => openPaymentDialog(purchase)}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Catat Pembayaran
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => markAsPaid.mutate(purchase.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Tandai Lunas
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditPurchase(purchase);
                              setOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deletePurchase.mutate(purchase.id)}
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
          
          {totalPages > 1 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={purchasesCount}
            />
          )}
        </div>

        {/* Purchase Payment Dialog */}
        <PurchasePaymentForm
          purchase={selectedPurchaseForPayment}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
        />

        {/* Purchase Detail Dialog */}
        <PurchaseDetailModal
          purchase={selectedPurchaseForDetail}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </div>
    </Layout>
  );
};

export default Purchases;
