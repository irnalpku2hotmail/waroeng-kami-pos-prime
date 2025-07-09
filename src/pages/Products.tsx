import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Layout from '@/components/Layout';
import ProductsTable from '@/components/products/ProductsTable';
import ProductsFilters from '@/components/products/ProductsFilters';
import ProductsHeader from '@/components/products/ProductsHeader';
import ProductsLoading from '@/components/products/ProductsLoading';
import ProductsEmptyState from '@/components/products/ProductsEmptyState';
import ProductsPagination from '@/components/products/ProductsPagination';
import ProductForm from '@/components/ProductForm';
import ProductDetails from '@/components/ProductDetails';

const ITEMS_PER_PAGE = 10;

const Products = () => {
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, categoryFilter, statusFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `, { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }
      
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const products = productsData?.data || [];
  const productsCount = productsData?.count || 0;
  const totalPages = Math.ceil(productsCount / ITEMS_PER_PAGE);

  const handleCloseDialog = () => {
    setOpen(false);
    setEditProduct(null);
  };

  const handleSuccess = () => {
    handleCloseDialog();
  };

  const handleEdit = (product: any) => {
    setEditProduct(product);
    setOpen(true);
  };

  const handleViewDetails = (product: any) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedProduct(null);
  };

  const handleFiltersChange = (filters: {
    searchTerm?: string;
    selectedCategory?: string;
    stockFilter?: string;
  }) => {
    if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm);
    if (filters.selectedCategory !== undefined) setCategoryFilter(filters.selectedCategory);
    if (filters.stockFilter !== undefined) setStatusFilter(filters.stockFilter);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const hasFilters = searchTerm || categoryFilter || statusFilter;

  return (
    <Layout>
      <div className="space-y-6">
        <ProductsHeader 
          onAddProduct={() => {
            setEditProduct(null);
            setOpen(true);
          }}
          totalProducts={productsCount}
        />

        <ProductsFilters
          searchTerm={searchTerm}
          selectedCategory={categoryFilter}
          stockFilter={statusFilter}
          categories={categories || []}
          onFiltersChange={handleFiltersChange}
        />

        {isLoading ? (
          <ProductsLoading />
        ) : products.length === 0 ? (
          <ProductsEmptyState 
            hasFilters={!!hasFilters}
            onAddProduct={() => {
              setEditProduct(null);
              setOpen(true);
            }}
          />
        ) : (
          <ProductsTable
            products={products}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={productsCount}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
          />
        )}

        {totalPages > 1 && (
          <ProductsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}

        {/* Add/Edit Product Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              product={editProduct}
              onSuccess={handleSuccess}
              onClose={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>

        {/* Product Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Produk</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <ProductDetails 
                product={selectedProduct}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Products;
