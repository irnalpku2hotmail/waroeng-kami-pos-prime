
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, Download } from 'lucide-react';
import Layout from '@/components/Layout';
import ProductForm from '@/components/ProductForm';
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
          price_variants(id, name, price, minimum_quantity, is_active),
          unit_conversions(id, conversion_factor, from_unit_id, to_unit_id)
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else if (totalPages > 1) {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Halaman {currentPage} dari {totalPages}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-accent'}
              />
            </PaginationItem>
            
            {getVisiblePages().map((page, index) => (
              <PaginationItem key={index}>
                {page === '...' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page as number);
                    }}
                    isActive={currentPage === page}
                    className="hover:bg-accent"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-accent'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  // Show error message if there's an error
  if (error) {
    console.error('Products page error:', error);
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-blue-800">Manajemen Produk</h1>
          </div>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-500">Error memuat data: {error.message}</p>
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
              className="mt-4"
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Produk</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditProduct(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Produk
                </Button>
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
          </div>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Cari produk atau barcode..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
        </div>

        <div className="border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Memuat data produk...</p>
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Tidak ada produk yang ditemukan' : 'Belum ada produk'}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-400 mt-2">
                  Klik "Tambah Produk" untuk menambahkan produk pertama Anda
                </p>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gambar</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Harga Jual</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Varian Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.barcode && (
                            <div className="text-sm text-gray-500">{product.barcode}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.categories?.name || '-'}</TableCell>
                      <TableCell>{product.units?.name || '-'}</TableCell>
                      <TableCell>Rp {product.selling_price?.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <span className={product.current_stock <= product.min_stock ? 'text-red-600' : 'text-green-600'}>
                          {product.current_stock}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">
                          (min: {product.min_stock})
                        </span>
                      </TableCell>
                      <TableCell>
                        {product.price_variants?.length > 0 ? (
                          <div className="text-sm">
                            {product.price_variants.slice(0, 2).map((variant: any) => (
                              <div key={variant.id} className="text-xs">
                                {variant.name}: Rp {variant.price?.toLocaleString('id-ID')} (min: {variant.minimum_quantity})
                              </div>
                            ))}
                            {product.price_variants.length > 2 && (
                              <div className="text-xs text-gray-500">+{product.price_variants.length - 2} lainnya</div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditProduct(product);
                              setOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
                                deleteProduct.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Products;
