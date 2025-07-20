
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import CartModal from '@/components/CartModal';
import { useState } from 'react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const query = searchParams.get('q') || '';
  const categoryQuery = searchParams.get('category') || '';

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['search-products', query, categoryQuery],
    queryFn: async () => {
      if (!query.trim() && !categoryQuery.trim()) return [];

      let queryBuilder = supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .eq('is_active', true);

      if (categoryQuery.trim()) {
        // Search by category name
        queryBuilder = queryBuilder.or(`categories.name.ilike.%${categoryQuery}%`);
      } else if (query.trim()) {
        // Search in products and categories
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,categories.name.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder.order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!(query.trim() || categoryQuery.trim())
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const displayQuery = categoryQuery || query;

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Hasil Pencarian
          </h1>
          <p className="text-gray-600">"{displayQuery}"</p>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-500">Mencari produk...</p>
          </div>
        )}

        {!isLoading && products.length === 0 && (query.trim() || categoryQuery.trim()) && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Tidak ada hasil ditemukan
            </h2>
            <p className="text-gray-500">
              Coba gunakan kata kunci yang berbeda atau lebih umum
            </p>
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Ditemukan {products.length} produk untuk "{displayQuery}"
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
              {products.map((product) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {product.categories && (
                        <Badge variant="secondary" className="text-xs">
                          {product.categories.name}
                        </Badge>
                      )}
                      
                      <h3 className="font-medium text-sm line-clamp-2 h-10">
                        {product.name}
                      </h3>
                      
                      <p className="text-lg font-bold text-blue-600">
                        {formatPrice(product.selling_price)}
                      </p>
                      
                      <div className="flex items-center justify-center">
                        <Badge 
                          variant={product.current_stock > 0 ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <HomeFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default SearchResults;
