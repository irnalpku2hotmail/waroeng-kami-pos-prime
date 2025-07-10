
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import ProductsHeader from '@/components/products/ProductsHeader';
import ProductsFilters from '@/components/products/ProductsFilters';
import ProductsTable from '@/components/products/ProductsTable';
import ProductsLoading from '@/components/products/ProductsLoading';
import ProductsEmptyState from '@/components/products/ProductsEmptyState';
import ProductsPagination from '@/components/products/ProductsPagination';
import ProductQRModal from '@/components/ProductQRModal';

const ITEMS_PER_PAGE = 10;

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory, selectedUnit, currentPage],
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
      
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      if (selectedUnit) {
        query = query.eq('unit_id', selectedUnit);
      }
      
      const { data, error, count } = await query
        .order('name')
        .range(from, to);
      
      if (error) throw error;
      return { data, count };
    }
  });

  const products = productsData?.data || [];
  const productsCount = productsData?.count || 0;
  const totalPages = Math.ceil(productsCount / ITEMS_PER_PAGE);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handleUnitChange = (value: string) => {
    setSelectedUnit(value);
    setCurrentPage(1);
  };

  const handleShowQRCode = (product: any) => {
    setSelectedProduct(product);  
    setQrModalOpen(true);
  };

  const handleExport = () => {
    // Export functionality implementation
    console.log('Export products to Excel');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <ProductsHeader onExport={handleExport} />
        
        <ProductsFilters
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          selectedUnit={selectedUnit}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onUnitChange={handleUnitChange}
        />

        {isLoading ? (
          <ProductsLoading />
        ) : products.length === 0 ? (
          <ProductsEmptyState />
        ) : (
          <>
            <ProductsTable 
              products={products} 
              onShowQRCode={handleShowQRCode}
            />
            
            {totalPages > 1 && (
              <ProductsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={productsCount}
              />
            )}
          </>
        )}

        <ProductQRModal
          product={selectedProduct}
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
        />
      </div>
    </Layout>
  );
};

export default Products;
