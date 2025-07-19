
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { useState, useRef } from 'react';

interface BestSellingProductsProps {
  onProductClick: (product: any) => void;
}

const BestSellingProducts = ({ onProductClick }: BestSellingProductsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

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
        .limit(12);

      if (error) throw error;
      return data;
    }
  });

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-6 w-6 text-red-500 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-900">Produk Terlaris</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-none w-48 animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-2xl mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Produk Terlaris</h2>
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Best Seller
          </Badge>
        </div>
        
        <div className="flex gap-2">
          {showLeftButton && (
            <button
              onClick={scrollLeft}
              className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          
          {showRightButton && (
            <button
              onClick={scrollRight}
              className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Products Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products?.map((product, index) => (
          <Card 
            key={product.id} 
            className="flex-none w-72 cursor-pointer hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-red-200 bg-white rounded-2xl group"
            onClick={() => onProductClick(product)}
          >
            <div className="relative">
              <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-2xl relative">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Ranking Badge */}
                <Badge className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1">
                  #{index + 1}
                </Badge>
                
                {/* Stock Status */}
                {product.current_stock <= 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-2xl">
                    <Badge variant="destructive" className="text-sm px-4 py-2">
                      Stok Habis
                    </Badge>
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"></div>
              </div>
            </div>
            
            <CardContent className="p-5">
              <div className="space-y-3">
                {/* Category */}
                {product.categories && (
                  <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 hover:bg-red-50">
                    {product.categories.name}
                  </Badge>
                )}
                
                {/* Product Name */}
                <h3 className="font-bold text-lg line-clamp-2 text-gray-800 group-hover:text-red-600 transition-colors leading-tight">
                  {product.name}
                </h3>
                
                {/* Price and Rating */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-red-600 font-bold text-xl">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(product.selling_price)}
                    </p>
                    
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700">4.8</span>
                    </div>
                  </div>
                  
                  {/* Stock Info */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                      product.current_stock > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
                    </span>
                    
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                      Terlaris
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            
            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BestSellingProducts;
