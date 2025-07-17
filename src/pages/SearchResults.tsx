
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import ProductGrid from '@/components/home/ProductGrid';
import { Card, CardContent } from '@/components/ui/card';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const categoryId = searchParams.get('category');

  const { data: products, isLoading } = useQuery({
    queryKey: ['search-products', query, categoryId],
    queryFn: async () => {
      let supabaseQuery = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (query) {
        supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
      }

      if (categoryId) {
        supabaseQuery = supabaseQuery.eq('category_id', categoryId);
      }

      const { data, error } = await supabaseQuery.order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: category } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {query ? `Hasil pencarian untuk "${query}"` : 
             category ? `Kategori: ${category.name}` : 'Semua Produk'}
          </h1>
          {products && (
            <p className="text-gray-600 mt-2">
              Ditemukan {products.length} produk
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Tidak ada produk yang ditemukan
            </p>
          </div>
        )}
      </div>

      <HomeFooter />
    </div>
  );
};

export default SearchResults;
