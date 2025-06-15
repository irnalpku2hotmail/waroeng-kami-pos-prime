import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, Package, Trash2, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import PaginationComponent from '@/components/PaginationComponent';
import { exportToExcel } from '@/utils/excelExport';

const ITEMS_PER_PAGE = 10;

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Query for all orders for export
  const { data: allOrdersData } = useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(name, current_stock, min_stock)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', searchTerm, statusFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            products(name, current_stock, min_stock)
          )
        `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`order_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      return { data, count };
    }
  });

  const orders = ordersData?.data || [];
  const ordersCount = ordersData?.count || 0;
  const totalPages = Math.ceil(ordersCount / ITEMS_PER_PAGE);

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Berhasil', description: 'Status pesanan berhasil diperbarui' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteOrder = useMutation({
    mutationFn: async (orderId: string) => {
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;

      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (orderError) throw orderError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Berhasil', description: 'Pesanan berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      confirmed: { label: 'Dikonfirmasi', variant: 'default' as const },
      preparing: { label: 'Disiapkan', variant: 'default' as const },
      shipping: { label: 'Dikirim', variant: 'default' as const },
      delivered: { label: 'Selesai', variant: 'default' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStockStatus = (currentStock: number, orderQuantity: number, minStock: number, orderStatus: string) => {
    let availableStock = currentStock;
    let stockText = '';
    let colorClass = '';
    
    // If order is not delivered yet, the stock is still committed
    if (orderStatus !== 'delivered' && orderStatus !== 'cancelled') {
      availableStock = currentStock; // Current stock already reflects pending orders
      stockText = `${currentStock} tersedia`;
    } else {
      stockText = `${currentStock} tersedia`;
    }
    
    // Determine color based on stock level
    if (currentStock <= minStock) {
      colorClass = 'text-red-600 font-semibold bg-red-50 px-2 py-1 rounded';
    } else if (currentStock <= minStock * 2) {
      colorClass = 'text-yellow-600 font-semibold bg-yellow-50 px-2 py-1 rounded';
    } else {
      colorClass = 'text-green-600 font-semibold bg-green-50 px-2 py-1 rounded';
    }
    
    return { stockText, colorClass, availableStock };
  };

  const handleShowDetails = (order: any) => {
    setSelectedOrder(order);
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const handleExportToExcel = () => {
    if (!allOrdersData || allOrdersData.length === 0) {
      toast({ title: 'Warning', description: 'Tidak ada data untuk diekspor', variant: 'destructive' });
      return;
    }

    const exportData = allOrdersData.map(order => ({
      'No. Pesanan': order.order_number,
      'Nama Pelanggan': order.customer_name,
      'Telepon': order.customer_phone || '-',
      'Alamat': order.customer_address || '-',
      'Tanggal Pesanan': new Date(order.order_date).toLocaleDateString('id-ID'),
      'Total Amount': Number(order.total_amount),
      'Status': order.status,
      'Metode Pembayaran': order.payment_method.toUpperCase(),
      'Catatan': order.notes || '-',
      'Produk': order.order_items?.map((item: any) => 
        `${item.products?.name} (${item.quantity}x)`
      ).join(', ') || '-'
    }));

    exportToExcel(exportData, 'Data_Pesanan', 'Pesanan');
    toast({ title: 'Berhasil', description: 'Data berhasil diekspor ke Excel' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Pesanan</h1>
          <Button variant="outline" onClick={handleExportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu Konfirmasi</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Input
            placeholder="Cari nomor order atau nama customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
              <SelectItem value="preparing">Disiapkan</SelectItem>
              <SelectItem value="shipping">Dikirim</SelectItem>
              <SelectItem value="delivered">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada order</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pesanan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Metode Bayar</TableHead>
                    <TableHead>Status Stok</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          {order.customer_phone && (
                            <div className="text-sm text-gray-500">{order.customer_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(order.order_date).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>Rp {Number(order.total_amount).toLocaleString('id-ID')}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="uppercase">{order.payment_method}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.order_items?.map((item: any) => {
                            const stockInfo = getStockStatus(
                              item.products?.current_stock || 0,
                              item.quantity,
                              item.products?.min_stock || 0,
                              order.status
                            );
                            return (
                              <div key={item.id} className="text-xs">
                                <div className="font-medium text-gray-700">{item.products?.name}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Pesan: {item.quantity}</span>
                                  <span className={stockInfo.colorClass}>
                                    {stockInfo.stockText}
                                  </span>
                                </div>
                                {stockInfo.availableStock < item.quantity && order.status !== 'delivered' && order.status !== 'cancelled' && (
                                  <div className="text-red-600 font-medium">
                                    ⚠️ Stok tidak mencukupi
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShowDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <Select
                              value={order.status}
                              onValueChange={(status) => updateOrderStatus.mutate({ orderId: order.id, status })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Menunggu</SelectItem>
                                <SelectItem value="confirmed">Konfirmasi</SelectItem>
                                <SelectItem value="preparing">Siapkan</SelectItem>
                                <SelectItem value="shipping">Kirim</SelectItem>
                                <SelectItem value="delivered">Selesai</SelectItem>
                                <SelectItem value="cancelled">Batal</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteOrder.mutate(order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
                totalItems={ordersCount}
              />
            </>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        />
      )}
    </Layout>
  );
};

export default Orders;
