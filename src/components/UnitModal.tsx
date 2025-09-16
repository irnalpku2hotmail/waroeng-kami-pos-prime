import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import UnitForm from './UnitForm';

interface UnitModalProps {
  unit?: any;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const UnitModal = ({ unit, onSuccess, trigger }: UnitModalProps) => {
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
            {unit ? 'Edit Unit' : 'Tambah Unit'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {unit ? 'Edit Unit' : 'Tambah Unit Baru'}
          </DialogTitle>
        </DialogHeader>
        <UnitForm
          unit={unit}
          onSuccess={handleSuccess}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default UnitModal;