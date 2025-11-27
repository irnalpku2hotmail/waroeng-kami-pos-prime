
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Package } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface BestSellingProductsProps {
  onProductClick?: (product: any) => void;
}

const BestSellingProducts = ({ onProductClick }: BestSellingProductsProps) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['best-selling-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('is_active', true)
        .order('current_stock', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data;
    }
  });

  const handleProductClick = (product: any) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-none w-48 animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-2xl mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Products Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products?.map((product, index) => (
          <Card 
            key={product.id} 
            className="flex-none w-48 cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-400 group bg-white rounded-2xl shadow-lg"
            onClick={() => handleProductClick(product)}
          >
            <CardContent className="p-4">
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Ranking Badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-1">
                    #{index + 1}
                  </Badge>
                </div>

                {/* Stock Status */}
                {product.current_stock <= 0 ? (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <Badge variant="destructive" className="text-xs">
                      Habis
                    </Badge>
                  </div>
                ) : product.current_stock <= product.min_stock ? (
                  <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs">
                    Terbatas
                  </Badge>
                ) : null}

                {/* Best Seller Badge */}
                <Badge className="absolute bottom-2 right-2 bg-green-600 text-white text-xs">
                  Terlaris
                </Badge>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="space-y-2">
                {/* Category */}
                {product.categories && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {product.categories.name}
                  </Badge>
                )}
                
                {/* Product Name */}
                <h3 className="font-bold text-sm line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors leading-tight">
                  {product.name}
                </h3>
                
                {/* Price and Rating */}
                <div className="space-y-2">
                  <p className="text-blue-600 font-bold text-lg">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(product.selling_price)}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>4.8</span>
                      <span className="text-gray-400">|</span>
                      <span>Terjual 100+</span>
                    </div>
                  </div>
                  
                  {/* Stock Info */}
                  <div className="text-xs text-gray-500">
                    Stok: {product.current_stock || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BestSellingProducts;
