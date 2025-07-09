import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import ProductsHeader from '@/components/products/ProductsHeader';
import ProductsFilters from '@/components/products/ProductsFilters';
import ProductsTable from '@/components/products/ProductsTable';
import ProductsLoading from '@/components/products/ProductsLoading';
import ProductsEmptyState from '@/components/products/ProductsEmptyState';
import ProductForm from '@/components/ProductForm';
import ProductDetails from '@/pages/ProductDetails';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ITEMS_PER_PAGE = 20;

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch products with pagination
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory, stockFilter, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          units(id, name, abbreviation)
        `, { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      // Stock filter
      if (stockFilter === 'in_stock') {
        query = query.gt('current_stock', 0);
      } else if (stockFilter === 'low_stock') {
        query = query.filter('current_stock', 'lte', 'min_stock');
      } else if (stockFilter === 'out_of_stock') {
        query = query.eq('current_stock', 0);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        count: count || 0
      };
    }
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const products = productsData?.data || [];
  const totalItems = productsData?.count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleViewDetails = (product: any) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedProduct(null);
  };

  const handleFormSuccess = () => {
    // Refresh the products data when form is successfully submitted
    // The query will automatically refetch due to query invalidation in ProductForm
  };

  // Reset page when filters change
  const handleFilterChange = (filters: any) => {
    setCurrentPage(1);
    if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm);
    if (filters.selectedCategory !== undefined) setSelectedCategory(filters.selectedCategory);
    if (filters.stockFilter !== undefined) setStockFilter(filters.stockFilter);
  };

  if (isLoading) {
    return (
      <Layout>
        <ProductsLoading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <ProductsHeader 
          totalProducts={totalItems}
          onAddProduct={() => setIsFormOpen(true)}
        />
        
        <ProductsFilters
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          stockFilter={stockFilter}
          categories={categories}
          onFiltersChange={handleFilterChange}
        />

        {products.length === 0 ? (
          <ProductsEmptyState 
            hasFilters={!!(searchTerm || selectedCategory || stockFilter !== 'all')}
            onAddProduct={() => setIsFormOpen(true)}
          />
        ) : (
          <ProductsTable
            products={products}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <ProductForm
              product={selectedProduct}
              onClose={handleCloseForm}
              onSuccess={handleFormSuccess}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <ProductDetails
                onClose={handleCloseDetails}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Products;
