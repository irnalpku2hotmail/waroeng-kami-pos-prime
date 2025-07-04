
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
import StockAdjustmentDialog from '@/components/inventory/StockAdjustmentDialog';

const Inventory = () => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products with stock info
  const { data: products = [] } = useQuery({
    queryKey: ['inventory-products', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation),
          suppliers(name)
        `);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch stock adjustments
  const { data: adjustments = [] } = useQuery({
    queryKey: ['stock-adjustments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select(`
          *,
          products(name, barcode),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    }
  });

  const handleOpenAdjustDialog = (product: any) => {
    setSelectedProduct(product);
    setIsAdjustmentDialogOpen(true);
  };

  const handleCloseAdjustDialog = () => {
    setSelectedProduct(null);
    setIsAdjustmentDialogOpen(false);
  };

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock);
  const totalStockValue = products.reduce((sum, p) => sum + (p.current_stock * p.base_price), 0);

  return (
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
          totalProducts={products.length}
          lowStockCount={lowStockProducts.length}
          totalStockValue={totalStockValue}
        />

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">Level Stok</TabsTrigger>
            <TabsTrigger value="adjustments">Penyesuaian</TabsTrigger>
            <TabsTrigger value="low-stock">Peringatan Stok Rendah</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <StockLevelTab 
              products={products}
              onAdjustStock={handleOpenAdjustDialog}
            />
          </TabsContent>

          <TabsContent value="adjustments">
            <StockAdjustmentsTab adjustments={adjustments} />
          </TabsContent>

          <TabsContent value="low-stock">
            <LowStockTab lowStockProducts={lowStockProducts} />
          </TabsContent>
        </Tabs>

        <StockAdjustmentDialog 
          isOpen={isAdjustmentDialogOpen}
          onClose={handleCloseAdjustDialog}
          product={selectedProduct}
        />
      </div>
    </Layout>
  );
};

export default Inventory;
