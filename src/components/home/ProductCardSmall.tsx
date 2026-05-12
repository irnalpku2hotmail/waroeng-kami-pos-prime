import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import WishlistButton from '@/components/wishlist/WishlistButton';

interface Product {
  id: string;
  name: string;
  selling_price: number;
  current_stock: number;
  image_url?: string;
  flashSalePrice?: number;
  isFlashSale?: boolean;
}

interface ProductCardSmallProps {
  product: Product;
  onProductClick: (productId: string) => void;
}

const ProductCardSmall: React.FC<ProductCardSmallProps> = ({ product, onProductClick }) => {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (product.current_stock <= 0) {
      toast({
        title: 'Stok Habis',
        description: 'Produk ini sedang tidak tersedia',
        variant: 'destructive',
      });
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.isFlashSale && product.flashSalePrice ? product.flashSalePrice : product.selling_price,
      quantity: 1,
      stock: product.current_stock,
      image: product.image_url,
      flashSalePrice: product.flashSalePrice,
      isFlashSale: product.isFlashSale
    });

    toast({
      title: 'Berhasil!',
      description: `${product.name} ditambahkan ke keranjang`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200 h-full"
      onClick={() => onProductClick(product.id)}
    >
      <CardContent className="p-3">
        {/* Product Image */}
        <div className="relative w-full h-32 mb-3 bg-gray-100 rounded-lg overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          {/* Wishlist Button */}
          <div className="absolute top-2 right-2 z-10">
            <WishlistButton productId={product.id} size="sm" />
          </div>
          
          {/* Flash Sale Badge */}
          {product.isFlashSale && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1">
              Flash Sale
            </Badge>
          )}

          {/* Stock Badge */}
          <Badge 
            variant={product.current_stock > 0 ? "secondary" : "destructive"}
            className="absolute bottom-2 left-2 text-xs"
          >
            {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
          </Badge>
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2 leading-tight">
            {product.name}
          </h3>
          
          {/* Price */}
          <div className="mb-3">
            {product.isFlashSale && product.flashSalePrice ? (
              <div className="space-y-1">
                <div className="text-red-600 font-bold text-sm">
                  {formatPrice(product.flashSalePrice)}
                </div>
                <div className="text-gray-500 line-through text-xs">
                  {formatPrice(product.selling_price)}
                </div>
              </div>
            ) : (
              <div className="text-blue-600 font-bold text-sm">
                {formatPrice(product.selling_price)}
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            onClick={handleAddToCart}
            disabled={product.current_stock <= 0}
            className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            {product.current_stock > 0 ? 'Tambah' : 'Habis'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCardSmall;
