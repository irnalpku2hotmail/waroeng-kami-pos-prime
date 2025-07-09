
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';

interface ProductsHeaderProps {
  onAddProduct: () => void;
  totalProducts: number;
}

const ProductsHeader = ({ onAddProduct, totalProducts }: ProductsHeaderProps) => (
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold text-blue-800">Manajemen Produk</h1>
    <div className="flex gap-2 items-center">
      <div className="text-sm text-gray-600">
        Total: {totalProducts} produk
      </div>
      <Button onClick={onAddProduct}>
        <Plus className="h-4 w-4 mr-2" />
        Tambah Produk
      </Button>
    </div>
  </div>
);

export default ProductsHeader;
