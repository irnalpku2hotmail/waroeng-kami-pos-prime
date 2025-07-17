
import { Button } from '@/components/ui/button';
import { Plus, FileDown } from 'lucide-react';
import ExcelImport from './ExcelImport';

interface ProductsHeaderProps {
  onExport: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  setEditProduct: (product: any) => void;
  editProduct: any;
  children: React.ReactNode;
}

const ProductsHeader = ({ 
  onExport, 
  open, 
  setOpen, 
  setEditProduct, 
  editProduct,
  children 
}: ProductsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
        <p className="text-gray-600">Kelola produk di toko Anda</p>
      </div>
      <div className="flex items-center gap-2">
        <ExcelImport onImportSuccess={() => window.location.reload()} />
        <Button 
          variant="outline" 
          onClick={onExport}
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          Export Excel
        </Button>
        {children}
      </div>
    </div>
  );
};

export default ProductsHeader;
