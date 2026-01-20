import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { getImageUrl } from '@/hooks/usePOS';
import ProductQuickViewModal from './ProductQuickViewModal';

interface ProductGridProps {
  products: any[];
  isLoading: boolean;
  addToCart: (product: any, quantity?: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading, addToCart }) => {
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const handleTouchStart = useCallback((product: any) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setQuickViewProduct(product);
    }, 500); // 500ms for long press
  }, []);

  const handleTouchEnd = useCallback((product: any) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // If it wasn't a long press, add to cart
    if (!isLongPressRef.current) {
      addToCart(product, 1);
    }
  }, [addToCart]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isLongPressRef.current = false;
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, product: any) => {
    e.preventDefault();
    setQuickViewProduct(product);
  }, []);

  if (isLoading) {
    return <div className="col-span-full text-center py-8">Loading...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-8">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Tidak ada produk ditemukan</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-[calc(100vh-220px)] overflow-y-auto">
        {products.map((product) => {
          const productImageUrl = getImageUrl(product.image_url);
          return (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:shadow-md transition-shadow select-none"
              onTouchStart={() => handleTouchStart(product)}
              onTouchEnd={() => handleTouchEnd(product)}
              onTouchCancel={handleTouchCancel}
              onMouseDown={() => handleTouchStart(product)}
              onMouseUp={() => handleTouchEnd(product)}
              onMouseLeave={handleTouchCancel}
              onContextMenu={(e) => handleContextMenu(e, product)}
            >
              <CardContent className="p-1.5">
                <div className="aspect-square mb-1 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  {productImageUrl ? (
                    <img 
                      src={productImageUrl} 
                      alt={String(product.name || 'Product')}
                      className="w-full h-full object-cover hover:scale-105 transition-transform pointer-events-none"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <h3 className="font-medium text-xs truncate">{String(product.name || 'Unnamed Product')}</h3>
                <p className="text-xs font-bold text-green-600">
                  Rp {String(product.selling_price?.toLocaleString('id-ID') || '0')}
                </p>
                <div className="flex justify-between items-center mt-0.5 text-[10px] text-gray-500">
                  <span>Stok: {String(product.current_stock || 0)}</span>
                  <span>{String(product.loyalty_points || 1)} pts</span>
                </div>
                {product.price_variants?.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-0.5">Grosir</Badge>
                )}
                {product.current_stock <= 0 && (
                  <Badge variant="destructive" className="w-full text-[10px] py-0 mt-0.5">Habis</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProductQuickViewModal
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={addToCart}
      />
    </>
  );
};

export default ProductGrid;
