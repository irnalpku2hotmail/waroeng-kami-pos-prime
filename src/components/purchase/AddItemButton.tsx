
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import ProductSearchModal from '@/components/ProductSearchModal';

interface AddItemButtonProps {
  onAddItem: (product: any) => void;
}

const AddItemButton = ({ onAddItem }: AddItemButtonProps) => {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const handleSelectProduct = (product: any) => {
    onAddItem({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_cost: product.base_price || 0,
      total_cost: product.base_price || 0,
      purchase_unit_id: product.unit_id
    });
    setSearchModalOpen(false);
  };

  return (
    <>
      <Button type="button" onClick={() => setSearchModalOpen(true)} variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Tambah Item
      </Button>

      <ProductSearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
        onSelectProduct={handleSelectProduct}
      />
    </>
  );
};

export default AddItemButton;
