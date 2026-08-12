import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import InventoryStats from '@/components/inventory/InventoryStats';
import StockLevelTab from '@/components/inventory/StockLevelTab';
import StockAdjustmentsTab from '@/components/inventory/StockAdjustmentsTab';
import LowStockTab from '@/components/inventory/LowStockTab';
import AccessControl from '@/components/layout/AccessControl';
import PaginationComponent from '@/components/PaginationComponent';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  DEFAULT_PAGE_SIZE,
  fetchInventoryProducts,
  inventoryProductsKey,
} from '@/lib/adminQueries';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('products');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [productsPage, setProductsPage] = useState(1);
  const [adjustmentsPage, setAdjustmentsPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  // Stock levels — server-side paginated, narrow select (no 4-level supplier embed).
  const { data: productsData } = useQuery({
    queryKey: inventoryProductsKey(debouncedSearch, productsPage, pageSize),
    queryFn: () => fetchInventoryProducts(debouncedSearch, productsPage, pageSize),
    placeholderData: keepPreviousData,
  });

  // Stock adjustments — server-side paginated.
  const { data: adjustmentsData } = useQuery({
    queryKey: ['stock-adjustments', adjustmentsPage, pageSize],
    queryFn: async () => {
      const from = (adjustmentsPage - 1) * pageSize;
      const { data, error, count } = await supabase
        .from('stock_adjustments')
        .select(
          'id, adjustment_type, quantity_change, previous_stock, new_stock, reason, created_at, products(name, barcode), profiles(full_name)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      return { data: data || [], count: count || 0 };
    },
    placeholderData: keepPreviousData,
  });

  // Aggregate stats — one lightweight query (3 numeric columns), cached 5 minutes.
  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('current_stock, min_stock, base_price')
        .eq('is_active', true);
      if (error) throw error;
      const rows = data || [];
      return {
        totalProducts: rows.length,
        lowStockCount: rows.filter((p) => p.current_stock <= p.min_stock).length,
        totalStockValue: rows.reduce(
          (sum, p) => sum + Number(p.current_stock) * Number(p.base_price),
          0
        ),
      };
    },
    staleTime: 5 * 60_000,
  });

  // Low stock list — only fetched when its tab is opened.
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, barcode, current_stock, min_stock, selling_price, units(name, abbreviation), categories(name)')
        .eq('is_active', true)
        .order('current_stock', { ascending: true })
        .limit(300);
      if (error) throw error;
      return (data || []).filter((p: any) => p.current_stock <= p.min_stock);
    },
    enabled: currentTab === 'low-stock',
    staleTime: 60_000,
  });

  const products = productsData?.data || [];
  const productsCount = productsData?.count || 0;
  const adjustments = adjustmentsData?.data || [];
  const adjustmentsCount = adjustmentsData?.count || 0;

  const pageSizeSelect = (
    <select
      value={pageSize}
      onChange={(e) => {
        setPageSize(Number(e.target.value));
        setProductsPage(1);
        setAdjustmentsPage(1);
      }}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
      aria-label="Baris per halaman"
    >
      {[20, 50, 100].map((n) => (
        <option key={n} value={n}>{n} / halaman</option>
      ))}
    </select>
  );

  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Inventory">
      <Layout>
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-xl md:text-3xl font-bold">Manajemen Inventori</h1>
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setProductsPage(1);
              }}
              className="max-w-sm"
            />
          </div>

          {/* Stats Cards */}
          <InventoryStats
            totalProducts={stats?.totalProducts ?? 0}
            lowStockCount={stats?.lowStockCount ?? 0}
            totalStockValue={stats?.totalStockValue ?? 0}
          />

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="products" className="text-xs md:text-sm">Level Stok</TabsTrigger>
              <TabsTrigger value="adjustments" className="text-xs md:text-sm">Penyesuaian</TabsTrigger>
              <TabsTrigger value="low-stock" className="text-xs md:text-sm">Stok Rendah</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <StockLevelTab products={products} />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {pageSizeSelect}
                <PaginationComponent
                  currentPage={productsPage}
                  totalPages={Math.max(1, Math.ceil(productsCount / pageSize))}
                  onPageChange={setProductsPage}
                  itemsPerPage={pageSize}
                  totalItems={productsCount}
                />
              </div>
            </TabsContent>

            <TabsContent value="adjustments" className="space-y-4">
              <StockAdjustmentsTab adjustments={adjustments} />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {pageSizeSelect}
                <PaginationComponent
                  currentPage={adjustmentsPage}
                  totalPages={Math.max(1, Math.ceil(adjustmentsCount / pageSize))}
                  onPageChange={setAdjustmentsPage}
                  itemsPerPage={pageSize}
                  totalItems={adjustmentsCount}
                />
              </div>
            </TabsContent>

            <TabsContent value="low-stock" className="space-y-4">
              <LowStockTab lowStockProducts={lowStockProducts} />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </AccessControl>
  );
};

export default Inventory;
