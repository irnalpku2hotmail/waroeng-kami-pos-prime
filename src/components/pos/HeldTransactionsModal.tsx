import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pause, 
  Play, 
  Trash2, 
  Clock, 
  User, 
  ShoppingCart,
  FileText,
  Edit2,
  Check,
  X
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

interface HeldTransactionsModalProps {
  heldTransactions: HeldTransaction[];
  onRecall: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onHoldCurrent: (note?: string) => void;
  canHold: boolean;
}

const HeldTransactionsModal: React.FC<HeldTransactionsModalProps> = ({
  heldTransactions,
  onRecall,
  onDelete,
  onUpdateNote,
  onHoldCurrent,
  canHold,
}) => {
  const [open, setOpen] = useState(false);
  const [holdNote, setHoldNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [recallConfirm, setRecallConfirm] = useState<string | null>(null);

  const handleHold = () => {
    onHoldCurrent(holdNote || undefined);
    setHoldNote('');
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

  const startEdit = (id: string, currentNote?: string) => {
    setEditingId(id);
    setEditNote(currentNote || '');
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdateNote(editingId, editNote);
      setEditingId(null);
      setEditNote('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNote('');
  };

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

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Pause className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Hold</span>
            {heldTransactions.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                {heldTransactions.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5" />
              Transaksi Ditahan
            </DialogTitle>
          </DialogHeader>

          {/* Hold Current Transaction */}
          {canHold && (
            <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
              <p className="text-sm font-medium">Tahan Transaksi Saat Ini</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Catatan (opsional)..."
                  value={holdNote}
                  onChange={(e) => setHoldNote(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleHold}>
                  <Pause className="h-4 w-4 mr-1" />
                  Hold
                </Button>
              </div>
            </div>
          )}

          {/* Held Transactions List */}
          <ScrollArea className="max-h-[400px]">
            {heldTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Pause className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Tidak ada transaksi ditahan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {heldTransactions.map((held) => (
                  <div 
                    key={held.id} 
                    className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {held.id}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(held.heldAt), { 
                            addSuffix: true, 
                            locale: localeId 
                          })}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {formatCurrency(calculateTotal(held.cart))}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        {held.cart.length} item ({held.cart.reduce((s, i) => s + i.quantity, 0)} qty)
                      </span>
                      {held.customer && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {held.customer.name}
                        </span>
                      )}
                    </div>

                    {/* Note */}
                    {editingId === held.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Catatan..."
                          className="text-xs h-8"
                          autoFocus
                        />
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary" onClick={saveEdit}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1 text-xs cursor-pointer hover:text-foreground"
                        onClick={() => startEdit(held.id, held.note)}
                      >
                        <FileText className="h-3 w-3" />
                        {held.note || <span className="italic text-muted-foreground">Tambah catatan...</span>}
                        <Edit2 className="h-3 w-3 ml-1 opacity-50" />
                      </div>
                    )}

                    {/* Cart Preview */}
                    <div className="text-xs bg-muted/50 rounded p-2 max-h-20 overflow-y-auto">
                      {held.cart.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate flex-1">{item.name}</span>
                          <span className="ml-2">x{item.quantity}</span>
                        </div>
                      ))}
                      {held.cart.length > 3 && (
                        <div className="text-muted-foreground">
                          +{held.cart.length - 3} item lainnya...
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setRecallConfirm(held.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Lanjutkan
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => setDeleteConfirm(held.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi Ditahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi ini akan dihapus permanen dan tidak dapat dikembalikan.
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
              Keranjang saat ini akan diganti dengan transaksi yang ditahan ini.
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

export default HeldTransactionsModal;
