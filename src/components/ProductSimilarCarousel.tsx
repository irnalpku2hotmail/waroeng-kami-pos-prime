
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProductSimilarCarouselProps {
  categoryId: string;
  currentProductId: string;
}

const ProductSimilarCarousel = ({ categoryId, currentProductId }: ProductSimilarCarouselProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: similarProducts = [], isLoading } = useQuery({
    queryKey: ['similar-products', categoryId, currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', currentProductId)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!categoryId
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image: product.image_url,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: product.selling_price,
      total_price: product.selling_price * 1,
      product: {
        id: product.id,
        name: product.name,
        image_url: product.image_url
      }
    });

    toast({
      title: 'Berhasil!',
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (similarProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Produk Serupa</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={scrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={scrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {similarProducts.map((product) => (
          <Card 
            key={product.id} 
            className="flex-none w-64 group hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleProductClick(product.id)}
          >
            <CardContent className="p-4">
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
                
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={product.current_stock > 0 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
                  </Badge>
                  
                  <Button
                    size="sm"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={product.current_stock === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ShoppingCart className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductSimilarCarousel;
