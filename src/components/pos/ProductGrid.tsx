
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PaginationComponent from '@/components/PaginationComponent';

interface Product {
  id: string;
  name: string;
  selling_price: number;
  current_stock: number;
  image_url?: string;
  barcode?: string;
  price_variants?: Array<{
    id: string;
    name: string;
    price: number;
    minimum_quantity: number;
  }>;
}

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  addToCart: (product: Product) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

const ProductGrid = ({ 
  products, 
  isLoading, 
  addToCart,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}: ProductGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-square bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Tidak ada produk ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="aspect-square mb-3 overflow-hidden rounded">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                
                <div className="text-sm text-gray-600">
                  Stok: {product.current_stock}
                </div>
                
                <div className="text-lg font-bold text-blue-600">
                  Rp {product.selling_price.toLocaleString('id-ID')}
                </div>
                
                <Button 
                  onClick={() => addToCart(product)}
                  className="w-full"
                  size="sm"
                  disabled={product.current_stock <= 0}
                >
                  {product.current_stock <= 0 ? 'Stok Habis' : 'Tambah'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <PaginationComponent 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
      />
    </div>
  );
};

export default ProductGrid;
