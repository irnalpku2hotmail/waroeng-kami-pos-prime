
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Download } from 'lucide-react';
import ProductForm from '@/components/ProductForm';
import { useState } from 'react';

interface ProductsHeaderProps {
  onExport: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  setEditProduct: (product: any) => void;
  editProduct: any;
  editDialogOpen: boolean;
  setEditDialogOpen: (open: boolean) => void;
}

const ProductsHeader = ({ 
  onExport, 
  open, 
  setOpen, 
  setEditProduct, 
  editProduct, 
  editDialogOpen, 
  setEditDialogOpen 
}: ProductsHeaderProps) => {
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      console.log('Export functionality not implemented');
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-blue-800">Manajemen Produk</h1>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" /> Export Excel
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Produk Baru</DialogTitle>
            </DialogHeader>
            <ProductForm 
              onClose={handleClose}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProductsHeader;
