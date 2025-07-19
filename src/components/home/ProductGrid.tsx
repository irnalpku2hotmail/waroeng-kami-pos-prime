
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  selling_price: number;
  current_stock: number;
  image_url: string;
  categories?: {
    name: string;
    id: string;
  };
}

interface ProductGridProps {
  products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
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
    
    console.log('Adding product to cart:', product);
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      image: product.image_url,
      quantity: 1,
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

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Tidak ada produk ditemukan</p>
      </div>
    );
  }

  console.log('Rendering products in grid:', products);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {products.map((product) => {
        console.log('Rendering product:', product);
        console.log('Product categories:', product.categories);
        
        return (
          <Card 
            key={product.id} 
            className="group hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleProductClick(product.id)}
          >
            <CardContent className="p-2">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={String(product.name)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                {product.categories && (
                  <Badge variant="secondary" className="text-xs">
                    {String(product.categories.name || 'Kategori')}
                  </Badge>
                )}
                
                <h3 className="font-medium text-xs line-clamp-2 h-8">
                  {String(product.name)}
                </h3>
                
                <p className="text-sm font-bold text-blue-600">
                  {formatPrice(product.selling_price)}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={product.current_stock > 0 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {product.current_stock > 0 ? `${product.current_stock}` : 'Habis'}
                  </Badge>
                  
                  <Button
                    size="sm"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={product.current_stock === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ShoppingCart className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductGrid;
