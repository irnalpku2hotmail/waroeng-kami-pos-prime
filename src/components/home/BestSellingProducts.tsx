
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';

interface BestSellingProductsProps {
  onProductClick: (product: any) => void;
}

const BestSellingProducts = ({ onProductClick }: BestSellingProductsProps) => {
  const { addItem } = useCart();
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
        .limit(8);

      if (error) throw error;
      console.log('Best selling products data:', data);
      return data;
    }
  });

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    console.log('Adding best selling product to cart:', product);
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      image: product.image_url,
      quantity: 1,
      stock: product.current_stock || 0
    });
    toast({
      title: "Produk ditambahkan",
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
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

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const handleProductClick = (product: any) => {
    console.log('Best selling product clicked:', product);
    onProductClick(product);
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-none w-36 md:w-44 animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  console.log('Rendering best selling products:', products);

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      {showLeftButton && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
      )}
      
      {showRightButton && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      )}

      {/* Products Container */}
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products?.map((product) => {
          console.log('Rendering best selling product:', product);
          console.log('Best selling product categories:', product.categories);
          
          return (
            <Card 
              key={product.id} 
              className="flex-none w-36 md:w-44 cursor-pointer hover:shadow-md transition-shadow duration-200 group"
              onClick={() => handleProductClick(product)}
            >
              <CardContent className="p-2 md:p-3">
                <div className="aspect-square mb-2 md:mb-3 overflow-hidden rounded-lg bg-gray-100 relative">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={String(product.name)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {product.current_stock <= 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">
                        Habis
                      </Badge>
                    </div>
                  )}
                  {product.current_stock <= product.min_stock && product.current_stock > 0 && (
                    <Badge className="absolute top-1 left-1 bg-orange-500 text-xs">
                      Terbatas
                    </Badge>
                  )}
                  <Badge className="absolute top-1 right-1 bg-green-600 text-xs">
                    Terlaris
                  </Badge>
                </div>
                
                <div className="space-y-1 md:space-y-2">
                  <h3 className="font-medium text-xs md:text-sm line-clamp-2 leading-tight h-8 md:h-10">
                    {String(product.name)}
                  </h3>
                  
                  {product.categories && (
                    <Badge variant="secondary" className="text-xs">
                      {typeof product.categories === 'string' 
                        ? String(product.categories) 
                        : String(product.categories?.name || 'Kategori')
                      }
                    </Badge>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-blue-600 text-xs md:text-sm">
                        Rp {product.selling_price?.toLocaleString('id-ID') || '0'}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>4.8</span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={(e) => handleAddToCart(e, product)}
                      className="h-7 w-7 p-0"
                      disabled={product.current_stock <= 0}
                    >
                      <ShoppingCart className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Stok: {product.current_stock || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BestSellingProducts;
