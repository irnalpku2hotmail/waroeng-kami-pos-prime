
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Star } from 'lucide-react';

interface ProductGridProps {
  searchTerm: string;
  selectedCategory: string | null;
  onProductClick: (product: any) => void;
}

const ProductGrid = ({ searchTerm, selectedCategory, onProductClick }: ProductGridProps) => {
  // Fetch products with filtering
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['home-products', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query
        .eq('is_active', true)
        .order('name')
        .limit(20);

      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedCategory ? 'Category Products' : 'All Products'}
          </h2>
          {searchTerm && (
            <p className="text-gray-600">
              Search results for "{searchTerm}"
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-3">
                  <div className="h-3 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">
              {searchTerm ? 'No products found' : 'No products available yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <Card 
                key={product.id}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => onProductClick(product)}
              >
                <div className="relative">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {product.current_stock <= 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                  {product.current_stock <= product.min_stock && product.current_stock > 0 && (
                    <Badge className="absolute top-2 left-2 bg-orange-500 text-xs">
                      Limited
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-3">
                  <h3 className="font-semibold mb-2 text-xs line-clamp-2 h-8">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-blue-600">
                      Rp {product.selling_price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{product.current_stock}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>4.5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
