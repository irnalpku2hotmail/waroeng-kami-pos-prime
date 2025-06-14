
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, Check, CreditCard } from 'lucide-react';
import Layout from '@/components/Layout';
import PurchaseForm from '@/components/PurchaseForm';
import CreditPaymentForm from '@/components/CreditPaymentForm';

const Purchases = () => {
  const [open, setOpen] = useState(false);
  const [editPurchase, setEditPurchase] = useState<any>(null);
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          suppliers(name),
          profiles(full_name),
          purchase_items(*)
        `);
      
      if (searchTerm) {
        query = query.or(`purchase_number.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

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
        .update({ payment_method: 'cash' })
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

  const getPaymentStatus = (purchase: any) => {
    if (purchase.payment_method === 'cash') {
      return <Badge className="bg-green-600">Paid</Badge>;
    } else if (purchase.payment_method === 'credit') {
      const isOverdue = purchase.due_date && new Date(purchase.due_date) < new Date();
      return (
        <Badge className={isOverdue ? 'bg-red-600' : 'bg-orange-600'}>
          {isOverdue ? 'Overdue' : 'Pending'}
        </Badge>
      );
    }
    return <Badge className="bg-gray-600">Unknown</Badge>;
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
                      <div className="flex gap-2">
                        {purchase.payment_method === 'credit' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPaymentDialog(purchase)}
                              className="text-blue-600 hover:bg-blue-50"
                              title="Catat Pembayaran"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsPaid.mutate(purchase.id)}
                              className="text-green-600 hover:bg-green-50"
                              title="Tandai Lunas"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditPurchase(purchase);
                            setOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePurchase.mutate(purchase.id)}
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

        {/* Credit Payment Dialog */}
        <CreditPaymentForm
          purchase={selectedPurchaseForPayment}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
        />
      </div>
    </Layout>
  );
};

export default Purchases;
