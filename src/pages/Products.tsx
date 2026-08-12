
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import ProductForm from '@/components/ProductForm';
import ProductsHeader from '@/components/products/ProductsHeader';
import ProductsFilters from '@/components/products/ProductsFilters';
import ProductsTable from '@/components/products/ProductsTable';
import ProductsLoading from '@/components/products/ProductsLoading';
import ProductsEmptyState from '@/components/products/ProductsEmptyState';
import ProductsPagination from '@/components/products/ProductsPagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { exportToExcel } from '@/utils/excelExport';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DEFAULT_PAGE_SIZE, fetchProducts, productsKey } from '@/lib/adminQueries';

const Products = () => {
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const debouncedSearch = useDebouncedValue(searchTerm, 350);

  const { data: productsData, isLoading } = useQuery({
    queryKey: productsKey(debouncedSearch, selectedCategory, currentPage, pageSize),
    queryFn: () => fetchProducts(debouncedSearch, selectedCategory, currentPage, pageSize),
    placeholderData: keepPreviousData,
  });

  const products = productsData?.data || [];
  const productsCount = productsData?.count || 0;
  const totalPages = Math.ceil(productsCount / pageSize);

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      // Fetch image URL first so we can clean storage after row delete
      const { data: prod } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', id)
        .maybeSingle();
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      if (prod?.image_url) {
        const { deleteStorageFileByUrlAsync } = await import('@/utils/storageCleanup');
        deleteStorageFileByUrlAsync(prod.image_url);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Berhasil', description: 'Produk berhasil dihapus' });
      setDeleteProductId(null);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setDeleteProductId(null);
    }
  });

  const handleDeleteProduct = (id: string) => {
    setDeleteProductId(id);
  };

  const handleExportToExcel = async () => {
    // Data for export is fetched only when the user actually clicks Export.
    const { data: allProductsData, error } = await supabase
      .from('products')
      .select('name, barcode, selling_price, current_stock, min_stock, is_active, created_at, categories(name), units(name)')
      .order('created_at', { ascending: false });
    if (error || !allProductsData || allProductsData.length === 0) {
      toast({ title: 'Warning', description: 'Tidak ada data untuk diekspor', variant: 'destructive' });
      return;
    }
    const exportData = allProductsData.map((product: any) => ({
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
    await exportToExcel(exportData, 'Data_Produk', 'Produk');
    toast({ title: 'Berhasil', description: 'Data berhasil diekspor ke Excel' });
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditProduct(null);
  };

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <ProductsHeader
          onExport={handleExportToExcel}
          open={open}
          setOpen={setOpen}
          setEditProduct={setEditProduct}
          editProduct={editProduct}
        >
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button onClick={() => setEditProduct(null)} className="inline-flex items-center px-2 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-primary text-white rounded-md">
                <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> 
                <span className="hidden sm:inline">Tambah Produk</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] md:w-auto">
              <DialogHeader>
                <DialogTitle className="text-sm md:text-base">{editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
              </DialogHeader>
              <ProductForm 
                product={editProduct}
                onSuccess={handleCloseDialog}
                onClose={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        </ProductsHeader>

        <ProductsFilters 
          searchTerm={searchTerm} 
          setSearchTerm={handleSearchChange}
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
        />

        <div className="border rounded-lg overflow-hidden">
          {isLoading && products.length === 0 ? (
            <ProductsLoading />
          ) : products?.length === 0 ? (
            <ProductsEmptyState />
          ) : (
            <>
              <ProductsTable
                products={products}
                onEdit={product => {
                  setEditProduct(product);
                  setOpen(true);
                }}
                onDelete={handleDeleteProduct}
              />
              <div className="flex items-center justify-between gap-2 flex-wrap border-t px-3 py-2">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  aria-label="Baris per halaman"
                >
                  {[20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n} / halaman</option>
                  ))}
                </select>
                <ProductsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={deleteProductId !== null} onOpenChange={(open) => !open && setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteProductId && deleteProduct.mutate(deleteProductId)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Products;
