
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProductCarouselProps {
  onProductClick: (product: any) => void;
}

const ProductCarousel = ({ onProductClick }: ProductCarouselProps) => {
  const { addItem } = useCart();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
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
        .limit(12);

      if (error) throw error;
      return data;
    }
  });

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      image: product.image_url,
      quantity: 1
    });
    toast({
      title: "Produk ditambahkan",
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {products?.map((product) => (
        <Card 
          key={product.id} 
          className="cursor-pointer hover:shadow-md transition-shadow duration-200 group"
          onClick={() => onProductClick(product)}
        >
          <CardContent className="p-3">
            <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
              <img
                src={product.image_url || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                {product.name}
              </h3>
              
              {product.categories && (
                <Badge variant="secondary" className="text-xs">
                  {product.categories.name}
                </Badge>
              )}
              
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-600 text-sm">
                  Rp {product.selling_price?.toLocaleString('id-ID') || '0'}
                </span>
                
                <Button
                  size="sm"
                  onClick={(e) => handleAddToCart(e, product)}
                  className="h-8 w-8 p-0"
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                Stok: {product.current_stock || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductCarousel;
