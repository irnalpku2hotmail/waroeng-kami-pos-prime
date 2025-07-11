
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductLikes } from '@/hooks/useProductLikes';

interface ProductGridProps {
  searchTerm: string;
  selectedCategory: string | null;
  onProductClick: (product: any) => void;
}

const ProductGrid = ({ searchTerm, selectedCategory, onProductClick }: ProductGridProps) => {
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const { toggleLike } = useProductLikes();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['home-products', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name, id),
          units(name, abbreviation)
        `)
        .eq('is_active', true)
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query.limit(12);
      if (error) throw error;
      return data || [];
    }
  });

  const handleLike = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const success = await toggleLike(productId);
      if (success) {
        setLikedProducts(prev => {
          const newSet = new Set(prev);
          if (newSet.has(productId)) {
            newSet.delete(productId);
          } else {
            newSet.add(productId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-64 rounded-2xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">Tidak ada produk ditemukan</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card
          key={product.id}
          className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
          onClick={() => onProductClick(product)}
        >
          <div className="relative">
            <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Like Button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-3 right-3 bg-white/90 hover:bg-white border-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110"
              onClick={(e) => handleLike(product.id, e)}
            >
              <Heart 
                className={`h-4 w-4 transition-colors duration-300 ${
                  likedProducts.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`} 
              />
            </Button>

            {/* Stock Badge */}
            {product.current_stock <= product.min_stock && (
              <Badge 
                variant="destructive" 
                className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm"
              >
                Stok Rendah
              </Badge>
            )}
          </div>

          <CardContent className="p-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                  {product.name}
                </h3>
                {product.categories && (
                  <p className="text-sm text-gray-500 font-medium">
                    {product.categories.name}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    Rp {product.selling_price?.toLocaleString('id-ID')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Stok: {product.current_stock} {product.units?.abbreviation}
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-600">4.5</span>
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;
