
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductsEmptyStateProps {
  hasFilters: boolean;
  onAddProduct: () => void;
}

const ProductsEmptyState = ({ hasFilters, onAddProduct }: ProductsEmptyStateProps) => (
  <div className="text-center py-12">
    <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      {hasFilters ? 'Tidak ada produk yang sesuai' : 'Belum ada produk'}
    </h3>
    <p className="text-gray-500 mb-6">
      {hasFilters 
        ? 'Coba ubah filter pencarian untuk melihat hasil lainnya'
        : 'Mulai dengan menambahkan produk pertama Anda'
      }
    </p>
    {!hasFilters && (
      <Button onClick={onAddProduct}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Produk
      </Button>
    )}
  </div>
);

export default ProductsEmptyState;
