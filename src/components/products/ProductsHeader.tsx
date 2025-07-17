
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Download } from 'lucide-react';

interface ProductsHeaderProps {
  onExport: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  setEditProduct: (v: any) => void;
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
}: ProductsHeaderProps) => (
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold text-blue-800">Manajemen Produk</h1>
    <div className="flex gap-2">
      <Button variant="outline" onClick={onExport}>
        <Download className="h-4 w-4 mr-2" /> Export Excel
      </Button>
      {children}
    </div>
  </div>
);

export default ProductsHeader;
