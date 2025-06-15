
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesReports from '@/components/reports/SalesReports';
import CustomerReports from '@/components/reports/CustomerReports';
import InventoryReports from '@/components/reports/InventoryReports';
import ExpenseReports from '@/components/reports/ExpenseReports';
import CODReports from '@/components/reports/CODReports';

const Reports = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-800">Laporan</h1>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sales">Penjualan</TabsTrigger>
            <TabsTrigger value="customers">Customer</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="expenses">Pengeluaran</TabsTrigger>
            <TabsTrigger value="cod">COD</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            <SalesReports />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerReports />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryReports />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <ExpenseReports />
          </TabsContent>

          <TabsContent value="cod" className="space-y-6">
            <CODReports />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;
