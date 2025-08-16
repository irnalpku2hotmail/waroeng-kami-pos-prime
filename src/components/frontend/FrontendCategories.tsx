
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

interface FrontendCategoriesProps {
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

const FrontendCategories = ({ selectedCategory, onCategorySelect }: FrontendCategoriesProps) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: productCounts = {} } = useQuery({
    queryKey: ['category-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category_id')
        .eq('is_active', true);
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(product => {
        if (product.category_id) {
          counts[product.category_id] = (counts[product.category_id] || 0) + 1;
        }
      });
      return counts;
    }
  });

  if (categories.length === 0) return null;

  return (
    <div className="px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Kategori Produk
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* All Categories */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              selectedCategory === null 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onCategorySelect(null)}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-medium text-sm mb-2">Semua</h3>
              <Badge variant="secondary" className="text-xs">
                {Object.values(productCounts).reduce((sum, count) => sum + count, 0)}
              </Badge>
            </CardContent>
          </Card>

          {/* Category Cards */}
          {categories.map((category) => (
            <Card
              key={category.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                selectedCategory === category.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onCategorySelect(category.id)}
            >
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {category.icon_url ? (
                    <img 
                      src={category.icon_url} 
                      alt={String(category.name)}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-white" />
                  )}
                </div>
                <h3 className="font-medium text-sm mb-2 line-clamp-2">
                  {String(category.name)}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {productCounts[category.id] || 0}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrontendCategories;
