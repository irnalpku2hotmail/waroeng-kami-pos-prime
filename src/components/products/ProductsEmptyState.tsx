
import { Package } from 'lucide-react';

const ProductsEmptyState = () => (
  <div className="text-center py-8">
    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
    <p className="text-gray-500">Belum ada produk</p>
  </div>
);

export default ProductsEmptyState;
