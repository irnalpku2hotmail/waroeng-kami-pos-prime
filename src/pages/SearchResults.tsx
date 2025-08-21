
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import EnhancedSearchWithSuggestions from '@/components/home/EnhancedSearchWithSuggestions';
import SearchProductCard from '@/components/search/SearchProductCard';
import SearchFilters from '@/components/search/SearchFilters';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Package } from 'lucide-react';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  // Fetch all products for filtering
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['search-products', query, category],
    queryFn: async () => {
      let supabaseQuery = supabase
        .from('products')
        .select(`
          id,
          name,
          image_url,
          selling_price,
          current_stock,
          categories (id, name)
        `)
        .eq('is_active', true);

      if (query) {
        supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
      }

      if (category && category !== 'all') {
        supabaseQuery = supabaseQuery.eq('category_id', category);
      }

      const { data, error } = await supabaseQuery.order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get max price for slider
  const maxPrice = useMemo(() => {
    if (!productsData?.length) return 1000000;
    return Math.max(...productsData.map(p => p.selling_price));
  }, [productsData]);

  // Filter products by price range
  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    
    return productsData.filter(product => 
      product.selling_price >= priceRange[0] && 
      product.selling_price <= priceRange[1]
    );
  }, [productsData, priceRange]);

  // Update URL params when filters change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    setSearchParams(params);
  }, [searchTerm, selectedCategory, setSearchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    setSearchParams(params);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <Search className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Hasil Pencarian</h1>
          </div>
          
          <EnhancedSearchWithSuggestions
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
          />
          
          {query && (
            <p className="mt-4 text-gray-600">
              Menampilkan hasil untuk: <span className="font-semibold">"{query}"</span>
              {filteredProducts && (
                <span className="ml-2">({filteredProducts.length} produk ditemukan)</span>
              )}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              maxPrice={maxPrice}
            />
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-3">
                      <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-6 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Tidak ada produk ditemukan
                  </h3>
                  <p className="text-gray-500 text-center">
                    Coba ubah kata kunci pencarian atau filter yang Anda gunakan
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts?.map((product) => (
                  <SearchProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SearchResults;
