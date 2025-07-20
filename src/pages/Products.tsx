
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import ProductsFilters from '@/components/products/ProductsFilters';
import ProductsTable from '@/components/products/ProductsTable';
import ProductsHeader from '@/components/products/ProductsHeader';
import ProductsStats from '@/components/products/ProductsStats';
import ProductsEmptyState from '@/components/products/ProductsEmptyState';
import ProductsLoading from '@/components/products/ProductsLoading';
import ProductsPagination from '@/components/products/ProductsPagination';
import ProductForm from '@/components/ProductForm';
import ExcelImport from '@/components/products/ExcelImport';
import { Plus } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch products with search and category filter
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, categoryFilter, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation),
          product_brands (name)
        `, { count: 'exact' });

      // Apply search filter
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        products: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE)
      };
    }
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Berhasil', description: 'Produk berhasil dihapus' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Gagal menghapus produk',
        variant: 'destructive',
      });
    },
  });

  const products = productsData?.products || [];
  const totalCount = productsData?.totalCount || 0;
  const totalPages = productsData?.totalPages || 0;

  // Stats calculation
  const stats = useMemo(() => {
    const totalProducts = totalCount;
    const activeProducts = products.filter(p => p.is_active).length;
    const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock).length;
    const totalValue = products.reduce((sum, p) => sum + (p.selling_price * p.current_stock), 0);

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalValue
    };
  }, [products, totalCount]);

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <ProductsHeader 
          onAddProduct={() => setShowAddForm(true)}
          onImport={() => setShowImportModal(true)}
        />
        
        <ProductsStats stats={stats} />

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Semua Produk</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Produk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProductsFilters 
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                />

                {isLoading ? (
                  <ProductsLoading />
                ) : products.length === 0 ? (
                  <ProductsEmptyState />
                ) : (
                  <>
                    <ProductsTable 
                      products={products}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                    
                    {totalPages > 1 && (
                      <ProductsPagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showAddForm && (
          <ProductForm
            product={editingProduct}
            onClose={handleCloseForm}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['products'] });
              handleCloseForm();
            }}
          />
        )}

        {showImportModal && (
          <ExcelImport
            open={showImportModal}
            onOpenChange={setShowImportModal}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['products'] });
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Products;
