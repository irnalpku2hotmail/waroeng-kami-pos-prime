
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Star } from 'lucide-react';

interface ProductGridProps {
  searchTerm?: string;
  selectedCategory?: string | null;
  onProductClick?: (product: any) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  searchTerm = '', 
  selectedCategory = null, 
  onProductClick 
}) => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['featured-products', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(abbreviation)
        `)
        .eq('is_active', true);

      // Apply search filter
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query.limit(8);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: flashSaleItems = [] } = useQuery({
    queryKey: ['flash-sale-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select(`
          *,
          products(*),
          flash_sales(*)
        `)
        .gt('stock_quantity', 0);
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-48"></div>
        ))}
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const isFlashSaleActive = (item: any) => {
    if (!item?.flash_sales) return false;
    const now = new Date();
    const startDate = new Date(item.flash_sales.start_date);
    const endDate = new Date(item.flash_sales.end_date);
    return now >= startDate && now <= endDate && item.flash_sales.is_active;
  };

  const handleProductClick = (product: any) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => {
          const flashSaleItem = flashSaleItems.find(item => item.product_id === product.id);
          const isOnSale = flashSaleItem && isFlashSaleActive(flashSaleItem);
          const currentPrice = isOnSale ? Number(flashSaleItem.sale_price) : Number(product.selling_price);
          const originalPrice = Number(product.selling_price);
          
          return (
            <Card 
              key={product.id} 
              className="group hover:shadow-md transition-all duration-300 border bg-white rounded-lg overflow-hidden cursor-pointer"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative">
                <div className="aspect-square bg-gray-50 p-3 flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-4xl text-gray-300">📦</div>
                  )}
                </div>
                
                {/* Flash Sale Badge */}
                {isOnSale && (
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1">
                    Sale
                  </Badge>
                )}
                
                {/* Stock Badge */}
                {product.current_stock <= product.min_stock && (
                  <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                    Terbatas
                  </Badge>
                )}

                {/* Wishlist Button */}
                <button className="absolute bottom-2 right-2 p-1.5 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Heart className="h-3 w-3 text-gray-600 hover:text-red-500" />
                </button>
              </div>

              <CardContent className="p-3">
                <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 h-8">
                  {product.name}
                </h3>
                
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">(4.5)</span>
                </div>

                <div className="space-y-1">
                  {isOnSale ? (
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-red-600">
                        {formatPrice(currentPrice)}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base font-bold text-blue-600">
                      {formatPrice(currentPrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    Stok: {product.current_stock}
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    +{product.loyalty_points} poin
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProductGrid;
