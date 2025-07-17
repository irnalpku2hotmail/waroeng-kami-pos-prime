
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, FileUp } from 'lucide-react';
import ExcelImport from './ExcelImport';

interface ProductsHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddProduct: () => void;
}

const ProductsHeader = ({ searchTerm, onSearchChange, onAddProduct }: ProductsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
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
        <Button onClick={onAddProduct} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </div>
    </div>
  );
};

export default ProductsHeader;
