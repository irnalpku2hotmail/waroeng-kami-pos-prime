
import { Package } from 'lucide-react';

interface ProductsEmptyStateProps {
  searchTerm: string;
}

const ProductsEmptyState = ({ searchTerm }: ProductsEmptyStateProps) => {
  return (
    <div className="text-center py-8">
      <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <p className="text-gray-500">
        {searchTerm ? 'Tidak ada produk yang ditemukan' : 'Belum ada produk'}
      </p>
      {!searchTerm && (
        <p className="text-sm text-gray-400 mt-2">
          Klik "Tambah Produk" untuk menambahkan produk pertama Anda
        </p>
      )}
    </div>
  );
};

export default ProductsEmptyState;
