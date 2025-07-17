
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartWithShipping } from '@/hooks/useCartWithShipping';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  selling_price: number;
  image_url?: string;
  current_stock: number;
  min_quantity: number;
}

interface ProductGridProps {
  products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
  const { addItem } = useCartWithShipping();

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.current_stock < product.min_quantity) {
      toast({
        title: 'Stok tidak mencukupi',
        description: `Stok tersedia: ${product.current_stock}`,
        variant: 'destructive'
      });
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      image: product.image_url || '/placeholder.svg',
      quantity: product.min_quantity
    });

    toast({
      title: 'Berhasil ditambahkan',
      description: `${product.name} telah ditambahkan ke keranjang`
    });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {products.map((product) => (
        <Link key={product.id} to={`/product/${product.id}`}>
          <Card className="group hover:shadow-lg transition-shadow duration-200 h-full">
            <CardContent className="p-3">
              <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={product.image_url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-blue-600">
                    Rp {product.selling_price.toLocaleString('id-ID')}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Heart className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    Stok: {product.current_stock}
                  </Badge>
                  <Button
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={product.current_stock < product.min_quantity}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default ProductGrid;
