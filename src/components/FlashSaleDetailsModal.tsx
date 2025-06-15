
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Zap, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface FlashSaleDetailsModalProps {
  flashSale: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FlashSaleDetailsModal = ({ flashSale, open, onOpenChange }: FlashSaleDetailsModalProps) => {
  if (!flashSale) return null;

  const getFlashSaleStatus = (fs: any) => {
    const now = new Date();
    const startDate = new Date(fs.start_date);
    const endDate = new Date(fs.end_date);

    if (!fs.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    } else if (now < startDate) {
      return <Badge className="bg-blue-600 text-white">Upcoming</Badge>;
    } else if (now >= startDate && now <= endDate) {
      return <Badge className="bg-green-600 text-white">Active</Badge>;
    } else {
      return <Badge className="bg-gray-600 text-white">Expired</Badge>;
    }
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Detail Flash Sale
          </DialogTitle>
          <DialogDescription>{flashSale.name}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-1">
            <p className="font-semibold">Deskripsi</p>
            <p className="text-sm text-gray-600">{flashSale.description || 'Tidak ada deskripsi.'}</p>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-semibold">Periode:</span>
              <span className="text-sm">
                {format(new Date(flashSale.start_date), 'dd MMM yyyy, HH:mm', { locale: id })} - {format(new Date(flashSale.end_date), 'dd MMM yyyy, HH:mm', { locale: id })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Status:</span>
              {getFlashSaleStatus(flashSale)}
            </div>
          </div>
          <hr />
          <div>
            <p className="font-semibold mb-2">Produk dalam Flash Sale</p>
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Harga Asli</TableHead>
                    <TableHead>Harga Sale</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Terjual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flashSale.flash_sale_items?.length > 0 ? (
                    flashSale.flash_sale_items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.products?.name}</TableCell>
                        <TableCell>{formatCurrency(item.products?.selling_price)}</TableCell>
                        <TableCell className="font-bold text-red-600">{formatCurrency(item.sale_price)}</TableCell>
                        <TableCell>{item.stock_quantity}</TableCell>
                        <TableCell>{item.sold_quantity}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Tidak ada produk dalam flash sale ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlashSaleDetailsModal;
