
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CategoryForm from './CategoryForm';

interface CategoryModalProps {
  category?: any;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const CategoryModal = ({ category, onSuccess, trigger }: CategoryModalProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess();
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {category ? 'Edit Kategori' : 'Tambah Kategori'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Kategori' : 'Tambah Kategori Baru'}
          </DialogTitle>
        </DialogHeader>
        <CategoryForm
          category={category}
          onSuccess={handleSuccess}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;
