
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import POSSalesReports from '@/components/reports/POSSalesReports';
import SalesReports from '@/components/reports/SalesReports';
import CustomerReports from '@/components/reports/CustomerReports';
import InventoryReports from '@/components/reports/InventoryReports';
import ExpenseReports from '@/components/reports/ExpenseReports';
import CODReports from '@/components/reports/CODReports';
import { useNavigate } from 'react-router-dom';

const Reports = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-3xl font-bold text-blue-800">Laporan</h1>

        <Tabs defaultValue="pos-sales" className="w-full">
          <div className="overflow-x-auto -mx-2 px-2">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-7">
              <TabsTrigger value="pos-sales" className="text-xs md:text-sm whitespace-nowrap">POS</TabsTrigger>
              <TabsTrigger value="cod-sales" className="text-xs md:text-sm whitespace-nowrap">COD</TabsTrigger>
              <TabsTrigger value="customers" className="text-xs md:text-sm whitespace-nowrap">Customer</TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs md:text-sm whitespace-nowrap">Inventory</TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs md:text-sm whitespace-nowrap">Pengeluaran</TabsTrigger>
              <TabsTrigger value="cod" className="text-xs md:text-sm whitespace-nowrap">COD Report</TabsTrigger>
              <TabsTrigger value="search" className="text-xs md:text-sm whitespace-nowrap" onClick={() => navigate('/search-analytics')}>Search</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pos-sales" className="space-y-6">
            <POSSalesReports />
          </TabsContent>

          <TabsContent value="cod-sales" className="space-y-6">
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

