
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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Tag, User, FileText, Link as LinkIcon } from 'lucide-react';

interface ExpenseDetailsModalProps {
  expense: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExpenseDetailsModal = ({ expense, open, onOpenChange }: ExpenseDetailsModalProps) => {
  if (!expense) return null;

  const getCategoryLabel = (category: string) => {
    const categories = {
      operational: 'Operasional',
      inventory: 'Inventori',
      marketing: 'Marketing',
      maintenance: 'Pemeliharaan',
      utilities: 'Utilitas',
      other: 'Lainnya'
    };
    return categories[category as keyof typeof categories] || 'Lainnya';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Pengeluaran</DialogTitle>
          <DialogDescription>{expense.title}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-lg font-bold text-blue-800">Rp {Number(expense.amount).toLocaleString('id-ID')}</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className="font-semibold w-28">Kategori</span>
              <Badge>{getCategoryLabel(expense.category)}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-semibold w-28">Tanggal</span>
              <span>{format(new Date(expense.expense_date), 'PPP', { locale: id })}</span>
            </div>
             <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-semibold w-28">Dibuat Oleh</span>
              <span>{expense.profiles?.full_name || 'Unknown'}</span>
            </div>
            {expense.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-gray-500 mt-1" />
                <span className="font-semibold w-28">Deskripsi</span>
                <p className="text-sm flex-1">{expense.description}</p>
              </div>
            )}
            {expense.receipt_url && (
              <div className="flex items-center gap-3">
                <LinkIcon className="h-4 w-4 text-gray-500" />
                <span className="font-semibold w-28">Bukti</span>
                <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Lihat Bukti
                </a>
              </div>
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

export default ExpenseDetailsModal;
