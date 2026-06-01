import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PurchaseHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  sellingPrice: number;
}

const formatRp = (n: number) =>
  'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

const PurchaseHistoryDialog = ({ open, onOpenChange, productId, productName, sellingPrice }: PurchaseHistoryDialogProps) => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['purchase-history', productId],
    enabled: open && !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_items')
        .select('id, quantity, unit_cost, total_cost, conversion_factor, created_at, purchases(purchase_number, purchase_date, suppliers(name))')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const avgCost = data.length
    ? data.reduce((s: number, r: any) => s + Number(r.unit_cost || 0), 0) / data.length
    : 0;
  const lastCost = data[0] ? Number((data[0] as any).unit_cost || 0) : 0;
  const margin = sellingPrice - lastCost;
  const marginPct = lastCost > 0 ? (margin / sellingPrice) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Riwayat Harga Beli — {productName}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
          <div className="rounded border p-2">
            <div className="text-muted-foreground">Harga Jual</div>
            <div className="font-semibold">{formatRp(sellingPrice)}</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">Beli Terakhir</div>
            <div className="font-semibold">{formatRp(lastCost)}</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">Rata-rata Beli</div>
            <div className="font-semibold">{formatRp(avgCost)}</div>
          </div>
          <div className="rounded border p-2">
            <div className="text-muted-foreground">Margin</div>
            <div className={`font-semibold flex items-center gap-1 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {margin >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatRp(margin)} ({marginPct.toFixed(1)}%)
            </div>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto border rounded">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Memuat...</div>
          ) : data.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Belum ada riwayat pembelian.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tanggal</TableHead>
                  <TableHead className="text-xs">No. Pembelian</TableHead>
                  <TableHead className="text-xs">Supplier</TableHead>
                  <TableHead className="text-xs text-right">Qty</TableHead>
                  <TableHead className="text-xs text-right">Harga Beli</TableHead>
                  <TableHead className="text-xs text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row: any) => {
                  const cost = Number(row.unit_cost || 0);
                  const m = sellingPrice - cost;
                  const mp = sellingPrice > 0 ? (m / sellingPrice) * 100 : 0;
                  const p = row.purchases || {};
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs">
                        {p.purchase_date ? new Date(p.purchase_date).toLocaleDateString('id-ID') : '-'}
                      </TableCell>
                      <TableCell className="text-xs">{p.purchase_number || '-'}</TableCell>
                      <TableCell className="text-xs">{p.suppliers?.name || '-'}</TableCell>
                      <TableCell className="text-xs text-right">{row.quantity}</TableCell>
                      <TableCell className="text-xs text-right">{formatRp(cost)}</TableCell>
                      <TableCell className={`text-xs text-right ${m >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatRp(m)} ({mp.toFixed(1)}%)
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseHistoryDialog;