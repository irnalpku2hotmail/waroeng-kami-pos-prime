
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import Layout from '@/components/Layout';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import OrdersStats from '@/components/orders/OrdersStats';
import OrdersFilters from '@/components/orders/OrdersFilters';
import OrdersTable from '@/components/orders/OrdersTable';
import { useOrdersData } from '@/hooks/useOrdersData';
import { exportToExcel } from '@/utils/excelExport';
import { supabase } from '@/integrations/supabase/client';

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const {
    orders,
    ordersCount,
    totalPages,
    currentPage,
    searchTerm,
    statusFilter,
    isLoading,
    itemsPerPage,
    setCurrentPage,
    handleSearchChange,
    handleStatusChange,
    handlePageSizeChange
  } = useOrdersData();

  const handleShowDetails = (order: any) => {
    setSelectedOrder(order);
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const handleExportToExcel = async () => {
    // Full dataset is only fetched when Export is clicked — never on page open.
    const { data: allOrdersData, error } = await supabase
      .from('orders')
      .select('order_number, customer_name, customer_phone, customer_address, order_date, total_amount, status, payment_method, notes, order_items(quantity, products(name))')
      .order('created_at', { ascending: false });
    if (error || !allOrdersData || allOrdersData.length === 0) {
      toast({ title: 'Warning', description: 'Tidak ada data untuk diekspor', variant: 'destructive' });
      return;
    }

    const exportData = allOrdersData.map((order: any) => ({
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

    await exportToExcel(exportData, 'Data_Pesanan', 'Pesanan');
    toast({ title: 'Berhasil', description: 'Data berhasil diekspor ke Excel' });
  };

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl md:text-3xl font-bold text-blue-800">Manajemen Pesanan</h1>
          <Button variant="outline" onClick={handleExportToExcel} size="sm" className="text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2">
            <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <OrdersStats 
          totalOrders={totalOrders}
          pendingOrders={pendingOrders}
          completedOrders={completedOrders}
          totalRevenue={totalRevenue}
        />

        {/* Filters */}
        <OrdersFilters 
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
        />

        {/* Orders Table */}
        <OrdersTable 
          orders={orders}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          ordersCount={ordersCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onShowDetails={handleShowDetails}
        />

        <div className="flex justify-end">
          <select
            value={itemsPerPage}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            aria-label="Baris per halaman"
          >
            {[20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / halaman</option>
            ))}
          </select>
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
