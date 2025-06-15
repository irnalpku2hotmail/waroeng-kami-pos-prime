
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import ProductsHeader from '@/components/products/ProductsHeader';
import ProductsFilters from '@/components/products/ProductsFilters';
import ProductsTable from '@/components/products/ProductsTable';
import ProductsLoading from '@/components/products/ProductsLoading';
import ProductsEmptyState from '@/components/products/ProductsEmptyState';
import ProductsErrorState from '@/components/products/ProductsErrorState';
import PaginationComponent from '@/components/PaginationComponent';
import { exportToExcel } from '@/utils/excelExport';

const ITEMS_PER_PAGE = 10;

const Products = () => {
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', searchTerm, currentPage],
    queryFn: async () => {
      console.log('Fetching products with search term:', searchTerm, 'page:', currentPage);
      
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          units(id, name, abbreviation),
          price_variants(id, name, price, minimum_quantity, is_active)
        `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      console.log('Products fetched:', data?.length, 'Total count:', count);
      return { data: data || [], count: count || 0 };
    }
  });

  // Query for all products for export
  const { data: allProductsData } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      console.log('Fetching all products for export');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching all products:', error);
        throw error;
      }
      
      console.log('All products fetched for export:', data?.length);
      return data || [];
    }
  });

  const products = productsData?.data || [];
  const productsCount = productsData?.count || 0;
  const totalPages = Math.ceil(productsCount / ITEMS_PER_PAGE);

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products'] });
      toast({ title: 'Berhasil', description: 'Produk berhasil dihapus' });
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleExportToExcel = () => {
    if (!allProductsData || allProductsData.length === 0) {
      toast({ title: 'Warning', description: 'Tidak ada data untuk diekspor', variant: 'destructive' });
      return;
    }

    const exportData = allProductsData.map(product => ({
      'Nama Produk': product.name,
      'Barcode': product.barcode || '-',
      'Kategori': product.categories?.name || '-',
      'Unit': product.units?.name || '-',
      'Harga Jual': product.selling_price,
      'Stok Saat Ini': product.current_stock,
      'Stok Minimum': product.min_stock,
      'Status': product.is_active ? 'Aktif' : 'Nonaktif',
      'Tanggal Dibuat': new Date(product.created_at).toLocaleDateString('id-ID')
    }));

    exportToExcel(exportData, 'Data_Produk', 'Produk');
    toast({ title: 'Berhasil', description: 'Data berhasil diekspor ke Excel' });
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditProduct(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleEditProduct = (product: any) => {
    setEditProduct(product);
    setOpen(true);
  };

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  // Show error message if there's an error
  if (error) {
    console.error('Products page error:', error);
    return (
      <Layout>
        <div className="space-y-6">
          <ProductsHeader
            open={open}
            setOpen={setOpen}
            editProduct={editProduct}
            setEditProduct={setEditProduct}
            onExportToExcel={handleExportToExcel}
            onCloseDialog={handleCloseDialog}
          />
          <ProductsErrorState error={error} onRetry={handleRetry} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <ProductsHeader
          open={open}
          setOpen={setOpen}
          editProduct={editProduct}
          setEditProduct={setEditProduct}
          onExportToExcel={handleExportToExcel}
          onCloseDialog={handleCloseDialog}
        />

        <ProductsFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />

        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <ProductsLoading />
          ) : products?.length === 0 ? (
            <ProductsEmptyState searchTerm={searchTerm} />
          ) : (
            <>
              <ProductsTable
                products={products}
                onEdit={handleEditProduct}
                onDelete={(id) => deleteProduct.mutate(id)}
              />
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={productsCount}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Products;
