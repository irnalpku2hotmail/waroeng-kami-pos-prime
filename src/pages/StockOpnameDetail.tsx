import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import AccessControl from '@/components/layout/AccessControl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BarcodeScanner from '@/components/BarcodeScanner';
import { toast } from 'sonner';
import { ArrowLeft, Package, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';

type OpnameItem = {
  id: string;
  session_id: string;
  product_id: string;
  barcode: string | null;
  physical_qty: number | null;
  system_qty: number;
  variance: number;
  status: 'pending' | 'match' | 'mismatch';
  notes: string | null;
  products?: { id: string; name: string; barcode: string | null; image_url: string | null; sku?: string | null };
};

const StockOpnameDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'match' | 'mismatch' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState<OpnameItem | null>(null);
  const [qtyInput, setQtyInput] = useState('');
  const qtyRef = useRef<HTMLInputElement>(null);

  const { data: session } = useQuery({
    queryKey: ['opname-session', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stock_opname_sessions')
        .select('*, categories(name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: items = [] } = useQuery<OpnameItem[]>({
    queryKey: ['opname-items', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stock_opname_items')
        .select('*, products(id, name, barcode, image_url)')
        .eq('session_id', id)
        .order('created_at');
      if (error) throw error;
      return (data || []) as OpnameItem[];
    },
    enabled: !!id,
  });

  const stats = useMemo(() => {
    const total = items.length;
    const match = items.filter((i) => i.status === 'match').length;
    const mismatch = items.filter((i) => i.status === 'mismatch').length;
    const pending = items.filter((i) => i.status === 'pending').length;
    return { total, match, mismatch, pending, progress: total ? Math.round(((match + mismatch) / total) * 100) : 0 };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== 'all') list = list.filter((i) => i.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.products?.name.toLowerCase().includes(q) || i.barcode?.includes(q));
    }
    return list;
  }, [items, filter, search]);

  const findByBarcode = (barcode: string) => {
    const trimmed = barcode.trim();
    return items.find((i) => i.barcode === trimmed || i.products?.barcode === trimmed);
  };

  const handleScan = (barcode: string) => {
    const found = findByBarcode(barcode);
    if (!found) {
      toast.error('Produk tidak ditemukan dalam session ini');
      return;
    }
    setCurrent(found);
    setQtyInput(found.physical_qty?.toString() ?? '');
    setTimeout(() => qtyRef.current?.focus(), 50);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error('Belum ada produk dipilih');
      const qty = parseFloat(qtyInput);
      if (isNaN(qty) || qty < 0) throw new Error('Qty tidak valid');
      const status: 'match' | 'mismatch' = qty === Number(current.system_qty) ? 'match' : 'mismatch';
      const { error } = await (supabase as any)
        .from('stock_opname_items')
        .update({
          physical_qty: qty,
          status,
          checked_by: user?.id,
          checked_at: new Date().toISOString(),
        })
        .eq('id', current.id);
      if (error) throw error;
      return { status, variance: qty - Number(current.system_qty) };
    },
    onSuccess: (res) => {
      if (res.status === 'match') toast.success('MATCH – Qty fisik sesuai');
      else toast.warning(`MISMATCH – Selisih ${res.variance > 0 ? '+' : ''}${res.variance}`);
      setCurrent(null);
      setQtyInput('');
      qc.invalidateQueries({ queryKey: ['opname-items', id] });
      qc.invalidateQueries({ queryKey: ['opname-items-agg'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async (newStatus: string) => {
      const patch: any = { status: newStatus };
      if (newStatus === 'approved') { patch.approved_by = user?.id; patch.approved_at = new Date().toISOString(); }
      const { error } = await (supabase as any).from('stock_opname_sessions').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status session diperbarui');
      qc.invalidateQueries({ queryKey: ['opname-session', id] });
      qc.invalidateQueries({ queryKey: ['opname-sessions'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Barcode manual input handler
  const [manualBarcode, setManualBarcode] = useState('');
  const manualRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    manualRef.current?.focus();
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleScan(manualBarcode);
    setManualBarcode('');
  };

  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Stock Opname">
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon"><Link to="/stock-opname"><ArrowLeft className="h-4 w-4" /></Link></Button>
              <div>
                <h1 className="text-xl font-bold">{session?.session_name || 'Loading...'}</h1>
                <p className="text-xs text-muted-foreground">Kategori: {session?.categories?.name || '-'} · Status: <Badge variant="outline">{session?.status}</Badge></p>
              </div>
            </div>
            <div className="flex gap-2">
              {session?.status === 'draft' && <Button size="sm" onClick={() => statusMut.mutate('in_progress')}>Mulai</Button>}
              {session?.status === 'in_progress' && <Button size="sm" onClick={() => statusMut.mutate('review')}>Ajukan Review</Button>}
              {session?.status === 'review' && <Button size="sm" onClick={() => statusMut.mutate('approved')}>Setujui</Button>}
              {session?.status === 'approved' && <Button size="sm" variant="outline" onClick={() => statusMut.mutate('closed')}>Tutup</Button>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="Total" value={stats.total} icon={<Package className="h-4 w-4" />} />
            <StatBox label="Match" value={stats.match} icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} />
            <StatBox label="Mismatch" value={stats.mismatch} icon={<XCircle className="h-4 w-4 text-red-600" />} />
            <StatBox label="Belum Dicek" value={stats.pending} icon={<Clock className="h-4 w-4 text-yellow-600" />} />
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${stats.progress}%` }} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Scan / Input Barcode</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <Input
                  ref={manualRef}
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Scan atau ketik barcode..."
                  className="font-mono"
                  autoFocus
                />
                <BarcodeScanner onScanSuccess={handleScan} />
                <Button type="submit">Cari</Button>
              </form>

              {current && (
                <div className="border rounded-lg p-3 bg-muted/30 flex flex-col md:flex-row gap-3">
                  {current.products?.image_url ? (
                    <img src={current.products.image_url} alt="" className="w-20 h-20 object-cover rounded" />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{current.products?.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{current.barcode || current.products?.barcode || '-'}</div>
                    <div className="text-xs text-muted-foreground">SKU: {(current.products as any)?.sku || '-'}</div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div>
                      <Label className="text-xs">Qty Fisik</Label>
                      <Input
                        ref={qtyRef}
                        type="number"
                        min="0"
                        step="1"
                        value={qtyInput}
                        onChange={(e) => setQtyInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveMut.mutate(); }}
                        className="w-28"
                      />
                    </div>
                    <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Simpan</Button>
                    <Button variant="outline" onClick={() => { setCurrent(null); setQtyInput(''); manualRef.current?.focus(); }}>Batal</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Daftar Produk</CardTitle>
                <div className="relative">
                  <Search className="h-3 w-3 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari..." className="pl-7 h-8 w-52" />
                </div>
              </div>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">Semua ({stats.total})</TabsTrigger>
                  <TabsTrigger value="match">Match ({stats.match})</TabsTrigger>
                  <TabsTrigger value="mismatch">Mismatch ({stats.mismatch})</TabsTrigger>
                  <TabsTrigger value="pending">Belum ({stats.pending})</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead className="text-right">Qty Fisik</TableHead>
                      <TableHead className="text-right">Selisih</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((i) => (
                      <TableRow
                        key={i.id}
                        className={`cursor-pointer ${i.status === 'match' ? 'bg-green-50 hover:bg-green-100' : i.status === 'mismatch' ? 'bg-red-50 hover:bg-red-100' : 'bg-yellow-50/40 hover:bg-yellow-50'}`}
                        onClick={() => { setCurrent(i); setQtyInput(i.physical_qty?.toString() ?? ''); setTimeout(() => qtyRef.current?.focus(), 50); }}
                      >
                        <TableCell className="font-medium">{i.products?.name}</TableCell>
                        <TableCell className="font-mono text-xs">{i.barcode || i.products?.barcode || '-'}</TableCell>
                        <TableCell className="text-right">{i.physical_qty ?? '-'}</TableCell>
                        <TableCell className={`text-right font-medium ${i.status === 'mismatch' ? (i.variance < 0 ? 'text-red-600' : 'text-orange-600') : ''}`}>
                          {i.status === 'pending' ? '-' : (i.variance > 0 ? `+${i.variance}` : i.variance)}
                        </TableCell>
                        <TableCell>
                          {i.status === 'match' && <Badge className="bg-green-600 hover:bg-green-700">MATCH</Badge>}
                          {i.status === 'mismatch' && <Badge variant="destructive">MISMATCH</Badge>}
                          {i.status === 'pending' && <Badge variant="outline" className="border-yellow-500 text-yellow-700">BELUM</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Tidak ada produk.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </AccessControl>
  );
};

const StatBox = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>{icon}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </CardContent>
  </Card>
);

export default StockOpnameDetail;