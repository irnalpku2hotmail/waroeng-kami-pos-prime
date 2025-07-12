
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface ProductRecommendationsProps {
  categoryId: string | null;
  currentProductId: string;
  onProductClick: (product: any) => void;
}

const ProductRecommendations = ({ categoryId, currentProductId, onProductClick }: ProductRecommendationsProps) => {
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['product-recommendations', categoryId, currentProductId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(abbreviation)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .limit(6);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!categoryId
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
            <div className="bg-gray-200 h-4 rounded mb-1"></div>
            <div className="bg-gray-200 h-3 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Tidak ada rekomendasi produk serupa.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {recommendations.map((product) => (
        <Card 
          key={product.id} 
          className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
          onClick={() => onProductClick(product)}
        >
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 p-2 flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="text-gray-400 text-xs text-center">
                  No Image
                </div>
              )}
            </div>
            {product.current_stock <= 0 && (
              <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                Habis
              </Badge>
            )}
          </div>
          
          <div className="p-3">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
              {product.name}
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-blue-600 font-bold text-sm">
                  Rp {Number(product.selling_price).toLocaleString('id-ID')}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500">4.5</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ProductRecommendations;
