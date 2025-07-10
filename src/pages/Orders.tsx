
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
    allOrdersData,
    itemsPerPage,
    setCurrentPage,
    handleSearchChange,
    handleStatusChange
  } = useOrdersData();

  const handleShowDetails = (order: any) => {
    setSelectedOrder(order);
  };

  // Calculate stats from all orders data (not just current page)
  const totalOrders = allOrdersData?.length || 0;
  const pendingOrders = allOrdersData?.filter(o => o.status === 'pending').length || 0;
  const completedOrders = allOrdersData?.filter(o => o.status === 'delivered').length || 0;
  const totalRevenue = allOrdersData
    ?.filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

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
