
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { getImageUrl } from '@/hooks/usePOS';

interface ProductGridProps {
  products: any[];
  isLoading: boolean;
  addToCart: (product: any, quantity?: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading, addToCart }) => {
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
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-[calc(100vh-220px)] overflow-y-auto">
      {products.map((product) => {
        const productImageUrl = getImageUrl(product.image_url);
        return (
          <Card 
            key={product.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => addToCart(product, 1)}
          >
            <CardContent className="p-1.5">
              <div className="aspect-square mb-1 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                {productImageUrl ? (
                  <img 
                    src={productImageUrl} 
                    alt={String(product.name || 'Product')}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
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
  );
};

export default ProductGrid;
