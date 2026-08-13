
import { Suspense, lazy } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

// Every report tab pulls in recharts; load only the tab the user opens.
const POSSalesReports = lazy(() => import('@/components/reports/POSSalesReports'));
const SalesReports = lazy(() => import('@/components/reports/SalesReports'));
const CustomerReports = lazy(() => import('@/components/reports/CustomerReports'));
const InventoryReports = lazy(() => import('@/components/reports/InventoryReports'));
const ExpenseReports = lazy(() => import('@/components/reports/ExpenseReports'));
const CODReports = lazy(() => import('@/components/reports/CODReports'));

/** Minimal, layout-stable fallback (no skeleton, no animation). */
const TabFallback = () => <div className="min-h-[240px]" />;

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
            <Suspense fallback={<TabFallback />}><POSSalesReports /></Suspense>
          </TabsContent>

          <TabsContent value="cod-sales" className="space-y-6">
            <Suspense fallback={<TabFallback />}><SalesReports /></Suspense>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Suspense fallback={<TabFallback />}><CustomerReports /></Suspense>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <Suspense fallback={<TabFallback />}><InventoryReports /></Suspense>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <Suspense fallback={<TabFallback />}><ExpenseReports /></Suspense>
          </TabsContent>

          <TabsContent value="cod" className="space-y-6">
            <Suspense fallback={<TabFallback />}><CODReports /></Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;

