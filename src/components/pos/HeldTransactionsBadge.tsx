import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Clock, 
  User, 
  ShoppingCart, 
  Play, 
  Trash2,
  Pause
} from 'lucide-react';
import { HeldTransaction } from '@/hooks/useHeldTransactions';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HeldTransactionsBadgeProps {
  heldTransactions: HeldTransaction[];
  onRecall: (id: string) => void;
  onDelete: (id: string) => void;
  onHoldModalOpen: () => void;
}

const HeldTransactionsBadge: React.FC<HeldTransactionsBadgeProps> = ({
  heldTransactions,
  onRecall,
  onDelete,
  onHoldModalOpen,
}) => {
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [recallConfirm, setRecallConfirm] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotal = (cart: any[]) => {
    return cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  };

  const handleRecall = (id: string) => {
    onRecall(id);
    setRecallConfirm(null);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  if (heldTransactions.length === 0) return null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-8 w-8"
          >
            <Bell className="h-4 w-4 text-amber-600" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] animate-pulse"
            >
              {heldTransactions.length}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-sm">Transaksi Ditahan</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => {
                setOpen(false);
                onHoldModalOpen();
              }}
            >
              Lihat Semua
            </Button>
          </div>

          {/* List */}
          <ScrollArea className="max-h-[300px]">
            <div className="p-2 space-y-2">
              {heldTransactions.slice(0, 5).map((held) => (
                <div 
                  key={held.id} 
                  className="border rounded-lg p-2 bg-background hover:bg-muted/30 transition-colors"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {held.id.slice(-8)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(held.heldAt), { 
                        addSuffix: true, 
                        locale: localeId 
                      })}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {held.cart.reduce((s, i) => s + i.quantity, 0)} item
                    </span>
                    {held.customer && (
                      <span className="flex items-center gap-1 truncate">
                        <User className="h-3 w-3" />
                        {held.customer.name}
                      </span>
                    )}
                    <span className="ml-auto font-semibold text-foreground">
                      {formatCurrency(calculateTotal(held.cart))}
                    </span>
                  </div>

                  {/* Note */}
                  {held.note && (
                    <p className="text-[10px] text-muted-foreground italic mb-2 truncate">
                      📝 {held.note}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      className="flex-1 h-7 text-xs"
                      onClick={() => setRecallConfirm(held.id)}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Lanjutkan
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="h-7 w-7 p-0"
                      onClick={() => setDeleteConfirm(held.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {heldTransactions.length > 5 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  +{heldTransactions.length - 5} transaksi lainnya
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recall Confirmation */}
      <AlertDialog open={!!recallConfirm} onOpenChange={() => setRecallConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lanjutkan Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Keranjang saat ini akan diganti dengan transaksi yang ditahan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => recallConfirm && handleRecall(recallConfirm)}>
              Ya, Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HeldTransactionsBadge;
