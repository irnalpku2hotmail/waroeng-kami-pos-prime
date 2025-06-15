
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Package } from 'lucide-react';

interface RewardDetailsModalProps {
  reward: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RewardDetailsModal = ({ reward, open, onOpenChange }: RewardDetailsModalProps) => {
  if (!reward) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-600" />
            Detail Reward
          </DialogTitle>
          <DialogDescription>{reward.name}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-1">
            <p className="font-semibold">Deskripsi</p>
            <p className="text-sm text-gray-600">{reward.description || 'Tidak ada deskripsi.'}</p>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="font-semibold">Stok:</span>
              <Badge variant={reward.stock_quantity > 0 ? "default" : "destructive"}>
                {reward.stock_quantity}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Status:</span>
              <Badge variant={reward.is_active ? "default" : "secondary"}>
                {reward.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          </div>
          <hr />
          <div>
            <p className="font-semibold mb-2">Produk dalam Reward</p>
            {reward.reward_items?.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {reward.reward_items.map((item: any) => (
                  <div key={item.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.products?.name}</p>
                      <p className="text-sm text-gray-500">{item.quantity}x item</p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="h-4 w-4"/>
                      <span className="font-semibold">{item.points_required} Poin</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center text-gray-500 py-4">Tidak ada produk dalam reward ini.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RewardDetailsModal;
