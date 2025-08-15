
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  selling_price: number;
  current_stock: number;
  image_url: string | null;
  description: string | null;
  categories?: {
    id: string;
    name: string;
  };
  units?: {
    name: string;
    abbreviation: string;
  };
}

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

const ProductGrid = ({ products, isLoading = false }: ProductGridProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image: product.image_url || undefined,
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Tidak ada produk tersedia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="group hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleProductClick(product.id)}
        >
          <CardContent className="p-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {product.categories && (
                <Badge variant="secondary" className="text-xs">
                  {String(product.categories.name || '')}
                </Badge>
              )}
              
              <h3 className="font-semibold text-sm line-clamp-2">
                {String(product.name || '')}
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
                  className="flex items-center gap-1"
                >
                  <ShoppingCart className="h-3 w-3" />
                  Beli
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;
