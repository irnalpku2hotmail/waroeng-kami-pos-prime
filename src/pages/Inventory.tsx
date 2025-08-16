
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import InventoryStats from '@/components/inventory/InventoryStats';
import StockLevelTab from '@/components/inventory/StockLevelTab';
import StockAdjustmentsTab from '@/components/inventory/StockAdjustmentsTab';
import LowStockTab from '@/components/inventory/LowStockTab';
import AccessControl from '@/components/layout/AccessControl';
import { usePagination } from '@/hooks/usePagination';
import PaginationComponent from '@/components/PaginationComponent';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('products');

  // Fetch products with stock info
  const { data: allProducts = [] } = useQuery({
    queryKey: ['inventory-products', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation),
          suppliers:purchase_items(
            purchases!inner(
              suppliers(name)
            )
          )
        `);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      return data || [];
    }
  });

  // Fetch stock adjustments
  const { data: allAdjustments = [] } = useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select(`
          *,
          products(name, barcode),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching adjustments:', error);
        throw error;
      }
      return data || [];
    }
  });

  const lowStockProducts = allProducts.filter(p => p.current_stock <= p.min_stock);
  const totalStockValue = allProducts.reduce((sum, p) => sum + (p.current_stock * p.base_price), 0);

  // Pagination for products
  const productsPagination = usePagination({
    totalItems: allProducts.length,
    itemsPerPage: 10
  });

  // Pagination for adjustments
  const adjustmentsPagination = usePagination({
    totalItems: allAdjustments.length,
    itemsPerPage: 10
  });

  // Pagination for low stock
  const lowStockPagination = usePagination({
    totalItems: lowStockProducts.length,
    itemsPerPage: 10
  });

  const getPaginatedData = () => {
    switch (currentTab) {
      case 'products':
        return {
          data: allProducts.slice(productsPagination.paginatedIndices.from, productsPagination.paginatedIndices.to + 1),
          pagination: productsPagination
        };
      case 'adjustments':
        return {
          data: allAdjustments.slice(adjustmentsPagination.paginatedIndices.from, adjustmentsPagination.paginatedIndices.to + 1),
          pagination: adjustmentsPagination
        };
      case 'low-stock':
        return {
          data: lowStockProducts.slice(lowStockPagination.paginatedIndices.from, lowStockPagination.paginatedIndices.to + 1),
          pagination: lowStockPagination
        };
      default:
        return { data: [], pagination: productsPagination };
    }
  };

  const { data: paginatedData, pagination } = getPaginatedData();

  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Inventory">
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Manajemen Inventori</h1>
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Stats Cards */}
          <InventoryStats 
            totalProducts={allProducts.length}
            lowStockCount={lowStockProducts.length}
            totalStockValue={totalStockValue}
          />

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList>
              <TabsTrigger value="products">Level Stok</TabsTrigger>
              <TabsTrigger value="adjustments">Penyesuaian</TabsTrigger>
              <TabsTrigger value="low-stock">Peringatan Stok Rendah</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <StockLevelTab products={paginatedData} />
              <PaginationComponent
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.setCurrentPage}
                totalItems={allProducts.length}
              />
            </TabsContent>

            <TabsContent value="adjustments" className="space-y-4">
              <StockAdjustmentsTab adjustments={paginatedData} />
              <PaginationComponent
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.setCurrentPage}
                totalItems={allAdjustments.length}
              />
            </TabsContent>

            <TabsContent value="low-stock" className="space-y-4">
              <LowStockTab lowStockProducts={paginatedData} />
              <PaginationComponent
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.setCurrentPage}
                totalItems={lowStockProducts.length}
              />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </AccessControl>
  );
};

export default Inventory;
