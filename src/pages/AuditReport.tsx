import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfDay } from 'date-fns';
import Layout from '@/components/Layout';
import AccessControl from '@/components/layout/AccessControl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, TrendingUp, Users, Package, Coins } from 'lucide-react';

const fmtRp = (n: number) =>
  'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

const AuditReport = () => {
  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fromISO = useMemo(() => new Date(from + 'T00:00:00').toISOString(), [from]);
  const toISO = useMemo(() => endOfDay(new Date(to + 'T00:00:00')).toISOString(), [to]);

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['audit-tx', fromISO, toISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, transaction_number, total_amount, source, order_id, customer_id, created_at')
        .gte('created_at', fromISO)
        .lte('created_at', toISO)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: txItems = [] } = useQuery({
    queryKey: ['audit-tx-items', fromISO, toISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_items')
        .select('id, transaction_id, quantity, total_price, created_at')
        .gte('created_at', fromISO)
        .lte('created_at', toISO);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pointTx = [] } = useQuery({
    queryKey: ['audit-points', fromISO, toISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('point_transactions')
        .select('id, customer_id, points_change, description, created_at')
        .gte('created_at', fromISO)
        .lte('created_at', toISO);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stockMoves = [] } = useQuery({
    queryKey: ['audit-stock', fromISO, toISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('id, product_id, movement_type, quantity, reference_table, reference_id, created_at')
        .gte('created_at', fromISO)
        .lte('created_at', toISO);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: customerStats } = useQuery({
    queryKey: ['audit-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, total_spent, total_points, total_orders')
        .order('total_spent', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  // Duplication detection: same order_id appearing >1 in transactions
  const orderIdCounts = useMemo(() => {
    const m = new Map<string, number>();
    transactions.forEach((t: any) => {
      if (t.order_id) m.set(t.order_id, (m.get(t.order_id) || 0) + 1);
    });
    return Array.from(m.entries()).filter(([, c]) => c > 1);
  }, [transactions]);

  const totalRevenue = transactions.reduce((s: number, t: any) => s + Number(t.total_amount || 0), 0);
  const totalPoints = pointTx.reduce((s: number, p: any) => s + Number(p.points_change || 0), 0);
  const posCount = transactions.filter((t: any) => t.source === 'POS' || !t.source).length;
  const orderCount = transactions.filter((t: any) => t.source === 'FRONTEND_ORDER').length;

  // Stock variance summary per product
  const stockVariance = useMemo(() => {
    const map = new Map<string, number>();
    stockMoves.forEach((m: any) => {
      map.set(m.product_id, (map.get(m.product_id) || 0) + Number(m.quantity || 0));
    });
    return Array.from(map.entries())
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 15);
  }, [stockMoves]);

  return (
    <AccessControl allowedRoles={['admin', 'manager']} resource="Audit Report">
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Laporan Audit</h1>
              <p className="text-sm text-muted-foreground">
                Ringkasan transaksi, loyalty, statistik customer, dan pergerakan stok.
              </p>
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <Label className="text-xs">Dari</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Sampai</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Total Transaksi" value={transactions.length.toString()} sub={`${posCount} POS · ${orderCount} Order`} />
            <StatCard icon={<Package className="h-4 w-4" />} label="Total Items" value={txItems.length.toString()} sub={fmtRp(totalRevenue)} />
            <StatCard icon={<Coins className="h-4 w-4" />} label="Loyalty Δ" value={totalPoints.toString()} sub={`${pointTx.length} entri`} />
            <StatCard icon={<Users className="h-4 w-4" />} label="Top Customers" value={(customerStats?.length || 0).toString()} sub="berdasarkan belanja" />
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Indikator Duplikasi Transaksi</CardTitle>
              {orderIdCounts.length === 0 ? (
                <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Aman</Badge>
              ) : (
                <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> {orderIdCounts.length} duplikat</Badge>
              )}
            </CardHeader>
            <CardContent>
              {orderIdCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada order_id yang ter-sync lebih dari sekali.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Order ID</TableHead><TableHead>Jumlah Transaksi</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderIdCounts.map(([oid, c]) => (
                      <TableRow key={oid}>
                        <TableCell className="font-mono text-xs">{oid}</TableCell>
                        <TableCell><Badge variant="destructive">{c}×</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Top 10 Customer</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead className="text-right">Order</TableHead>
                      <TableHead className="text-right">Poin</TableHead>
                      <TableHead className="text-right">Belanja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(customerStats || []).map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{c.name}</TableCell>
                        <TableCell className="text-right text-sm">{c.total_orders || 0}</TableCell>
                        <TableCell className="text-right text-sm">{c.total_points || 0}</TableCell>
                        <TableCell className="text-right text-sm">{fmtRp(c.total_spent || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Pergerakan Stok Terbesar (net)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Product ID</TableHead><TableHead className="text-right">Net Δ</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockVariance.map(([pid, qty]) => (
                      <TableRow key={pid}>
                        <TableCell className="font-mono text-xs">{pid.slice(0, 8)}…</TableCell>
                        <TableCell className={`text-right text-sm font-medium ${qty < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {qty > 0 ? '+' : ''}{qty}
                        </TableCell>
                      </TableRow>
                    ))}
                    {stockVariance.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground">Tidak ada pergerakan.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Transaksi Terbaru</CardTitle></CardHeader>
            <CardContent>
              {loadingTx ? (
                <p className="text-sm text-muted-foreground">Memuat...</p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Sumber</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 50).map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-mono text-xs">{t.transaction_number}</TableCell>
                          <TableCell><Badge variant={t.source === 'FRONTEND_ORDER' ? 'default' : 'secondary'}>{t.source || 'POS'}</Badge></TableCell>
                          <TableCell className="text-xs">{format(new Date(t.created_at), 'dd MMM HH:mm')}</TableCell>
                          <TableCell className="text-right">{fmtRp(t.total_amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AccessControl>
  );
};

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </CardContent>
  </Card>
);

export default AuditReport;