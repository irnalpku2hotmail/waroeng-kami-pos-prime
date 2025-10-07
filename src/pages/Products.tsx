
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const ITEMS_PER_PAGE = 10;

const Products = () => {
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name),
          price_variants(*)
        `, { count: 'exact' });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { data, count };
    }
  });

  // Query for all products for export
  const { data: allProductsData } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
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
              <button onClick={() => setEditProduct(null)} className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md">
                <Plus className="h-4 w-4 mr-2" /> Tambah Produk
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
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
          {isLoading ? (
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
              <ProductsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
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
