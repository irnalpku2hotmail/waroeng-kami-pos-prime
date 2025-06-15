
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Eye, Package, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import OrderStatusBadge from './OrderStatusBadge';
import OrderStockStatus from './OrderStockStatus';
import PaginationComponent from '@/components/PaginationComponent';

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  ordersCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onShowDetails: (order: any) => void;
}

const OrdersTable = ({ 
  orders, 
  isLoading, 
  currentPage, 
  totalPages, 
  ordersCount, 
  itemsPerPage,
  onPageChange, 
  onShowDetails 
}: OrdersTableProps) => {
  const queryClient = useQueryClient();

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

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Belum ada order</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
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
              <TableCell><OrderStatusBadge status={order.status} /></TableCell>
              <TableCell className="uppercase">{order.payment_method}</TableCell>
              <TableCell>
                <OrderStockStatus orderItems={order.order_items} orderStatus={order.status} />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onShowDetails(order)}
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
        onPageChange={onPageChange}
        itemsPerPage={itemsPerPage}
        totalItems={ordersCount}
      />
    </div>
  );
};

export default OrdersTable;
