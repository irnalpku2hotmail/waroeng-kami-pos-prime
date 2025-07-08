
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart, DollarSign, CreditCard, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import PurchaseForm from '@/components/PurchaseForm';
import PurchaseDetailModal from '@/components/PurchaseDetailModal';
import PurchaseStats from '@/components/purchase/PurchaseStats';
import PaginationComponent from '@/components/PaginationComponent';

const ITEMS_PER_PAGE = 10;

const Purchases = () => {
  const [open, setOpen] = useState(false);
  const [editPurchase, setEditPurchase] = useState<any>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
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
          purchase_payments(payment_amount)
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

  const handleCloseDialog = () => {
    setOpen(false);
    setEditPurchase(null);
  };

  const handleViewDetail = (purchase: any) => {
    setSelectedPurchase(purchase);
    setDetailModalOpen(true);
  };

  const getPaymentStatusBadge = (purchase: any) => {
    if (purchase.payment_method === 'cash') {
      return <Badge className="bg-green-100 text-green-800">Cash</Badge>;
    }
    
    if (purchase.payment_method === 'credit') {
      const totalPaid = purchase.purchase_payments?.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0) || 0;
      const remaining = purchase.total_amount - totalPaid;
      
      if (remaining <= 0) {
        return <Badge className="bg-green-100 text-green-800">Lunas</Badge>;
      } else if (totalPaid > 0) {
        return <Badge className="bg-yellow-100 text-yellow-800">Sebagian</Badge>;
      } else {
        return <Badge variant="destructive">Belum Bayar</Badge>;
      }
    }
    
    return <Badge variant="secondary">-</Badge>;
  };

  const getPaymentAmount = (purchase: any) => {
    if (purchase.payment_method === 'cash') {
      // For cash purchases, show the total amount as paid
      return purchase.total_amount;
    }
    
    if (purchase.payment_method === 'credit') {
      // For credit purchases, show the total of payments made
      const totalPaid = purchase.purchase_payments?.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0) || 0;
      return totalPaid;
    }
    
    return 0;
  };

  const getRemainingAmount = (purchase: any) => {
    if (purchase.payment_method === 'cash') {
      return 0; // Cash purchases have no remaining amount
    }
    
    if (purchase.payment_method === 'credit') {
      const totalPaid = purchase.purchase_payments?.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0) || 0;
      return Math.max(0, purchase.total_amount - totalPaid);
    }
    
    return purchase.total_amount;
  };

  // Calculate statistics
  const totalPurchases = purchases.reduce((sum, p) => sum + p.total_amount, 0);
  const totalCashPurchases = purchases
    .filter(p => p.payment_method === 'cash')
    .reduce((sum, p) => sum + p.total_amount, 0);
  
  const totalCreditPaid = purchases
    .filter(p => p.payment_method === 'credit')
    .reduce((sum, p) => {
      const totalPaid = p.purchase_payments?.reduce((paidSum: number, payment: any) => paidSum + payment.payment_amount, 0) || 0;
      return sum + totalPaid;
    }, 0);

  const totalCreditRemaining = purchases
    .filter(p => p.payment_method === 'credit')
    .reduce((sum, p) => {
      const totalPaid = p.purchase_payments?.reduce((paidSum: number, payment: any) => paidSum + payment.payment_amount, 0) || 0;
      const remaining = Math.max(0, p.total_amount - totalPaid);
      return sum + remaining;
    }, 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manajemen Pembelian</h1>
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
                onClose={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {totalPurchases.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cash</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rp {(totalCashPurchases + totalCreditPaid).toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">Termasuk pembayaran kredit</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sisa Kredit</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rp {totalCreditRemaining.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-muted-foreground">Belum dibayar</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchases.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <Input
            placeholder="Cari nomor pembelian atau invoice..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : purchases.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Tidak ada data pembelian
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No. Pembelian</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dibayar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sisa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {purchase.purchase_number}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {purchase.suppliers?.name || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          Rp {purchase.total_amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-4 text-sm text-green-600 font-medium">
                          Rp {getPaymentAmount(purchase).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-4 text-sm text-red-600 font-medium">
                          Rp {getRemainingAmount(purchase).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          {getPaymentStatusBadge(purchase)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {new Date(purchase.purchase_date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetail(purchase)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditPurchase(purchase);
                                setOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deletePurchase.mutate(purchase.id)}
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
                    totalItems={purchasesCount}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <PurchaseDetailModal
          purchase={selectedPurchase}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
        />
      </div>
    </Layout>
  );
};

export default Purchases;
