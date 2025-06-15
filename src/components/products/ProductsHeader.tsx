
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Download } from 'lucide-react';
import ProductForm from '@/components/ProductForm';

interface ProductsHeaderProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  editProduct: any;
  setEditProduct: (product: any) => void;
  onExportToExcel: () => void;
  onCloseDialog: () => void;
}

const ProductsHeader = ({
  open,
  setOpen,
  editProduct,
  setEditProduct,
  onExportToExcel,
  onCloseDialog
}: ProductsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-blue-800">Manajemen Produk</h1>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onExportToExcel}>
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditProduct(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            </DialogHeader>
            <ProductForm 
              product={editProduct}
              onSuccess={onCloseDialog}
              onClose={onCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductsHeader;
