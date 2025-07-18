
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ExcelImport from './ExcelImport';

interface ProductsHeaderProps {
  onExport: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  setEditProduct: (product: any) => void;
  editProduct: any;
  children?: React.ReactNode;
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
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <h1 className="text-2xl font-bold">Manajemen Produk</h1>
      
      <div className="flex gap-2">
        <Button
          onClick={onExport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              Import Excel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Import Produk dari Excel</DialogTitle>
            </DialogHeader>
            <ExcelImport />
          </DialogContent>
        </Dialog>

        {children}
      </div>
    </div>
  );
};

export default ProductsHeader;
