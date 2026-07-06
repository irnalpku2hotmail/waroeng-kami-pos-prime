import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import Layout from '@/components/Layout';
import AccessControl from '@/components/layout/AccessControl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, ClipboardList } from 'lucide-react';

const statusVariant: Record<string, any> = {
  draft: 'secondary',
  in_progress: 'default',
  review: 'outline',
  approved: 'default',
  closed: 'secondary',
};

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  review: 'Review',
  approved: 'Approved',
  closed: 'Closed',
};

const StockOpname = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ session_name: '', category_id: '', notes: '' });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories-opname'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['opname-sessions'],
    queryFn: async () => {
      // NOTE: created_by FK points to auth.users, not profiles, so we cannot embed profiles via PostgREST.
      // Fetch sessions + categories in one query, then join profiles client-side.
      const { data: sess, error } = await (supabase as any)
        .from('stock_opname_sessions')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[StockOpname] failed to fetch sessions:', error);
        toast.error(`Gagal memuat session: ${error.message}`);
        throw error;
      }
      const creatorIds = Array.from(new Set((sess || []).map((s: any) => s.created_by).filter(Boolean)));
      let profileMap: Record<string, string> = {};
      if (creatorIds.length) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', creatorIds as string[]);
        if (pErr) {
          console.warn('[StockOpname] failed to fetch profiles (non-fatal):', pErr);
        } else {
          profileMap = Object.fromEntries((profs || []).map((p: any) => [p.id, p.full_name]));
        }
      }
      return (sess || []).map((s: any) => ({ ...s, profiles: { full_name: profileMap[s.created_by] || '-' } }));
    },
  });

  const { data: itemsAgg = [] } = useQuery({
    queryKey: ['opname-items-agg'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stock_opname_items')
        .select('session_id, status, variance');
      if (error) {
        console.error('[StockOpname] failed to fetch items agg:', error);
        throw error;
      }
      return data || [];
    },
  });

  const aggBySession = (sid: string) => {
    const items = itemsAgg.filter((i: any) => i.session_id === sid);
    const total = items.length;
    const checked = items.filter((i: any) => i.status !== 'pending').length;
    const match = items.filter((i: any) => i.status === 'match').length;
    const mismatch = items.filter((i: any) => i.status === 'mismatch').length;
    return { total, checked, match, mismatch, progress: total ? Math.round((checked / total) * 100) : 0 };
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.session_name.trim()) throw new Error('Nama session wajib');
      if (!form.category_id) throw new Error('Pilih kategori');

      // Validate: kategori harus punya produk aktif
      const { data: preview, error: prevErr } = await supabase
        .from('products')
        .select('id, barcode, current_stock')
        .eq('category_id', form.category_id)
        .eq('is_active', true);
      if (prevErr) throw prevErr;
      if (!preview || preview.length === 0) {
        throw new Error('Kategori ini tidak memiliki produk aktif. Session tidak bisa dibuat.');
      }

      const { data: session, error } = await (supabase as any)
        .from('stock_opname_sessions')
        .insert({
          session_name: form.session_name,
          category_id: form.category_id,
          notes: form.notes || null,
          created_by: user?.id,
          status: 'draft',
        })
        .select()
        .single();
      if (error) {
        console.error('[StockOpname] insert session failed:', error);
        throw new Error(`Insert session gagal: ${error.message}`);
      }

      const rows = preview.map((p: any) => ({
        session_id: session.id,
        product_id: p.id,
        barcode: p.barcode,
        system_qty: p.current_stock || 0,
        status: 'pending',
      }));
      const { error: iErr } = await (supabase as any).from('stock_opname_items').insert(rows);
      if (iErr) {
        console.error('[StockOpname] insert items failed:', iErr);
        // Rollback session if items failed
        await (supabase as any).from('stock_opname_sessions').delete().eq('id', session.id);
        throw new Error(`Insert items gagal: ${iErr.message}`);
      }
      return session;
    },
    onSuccess: () => {
      toast.success('Session opname dibuat');
      setOpen(false);
      setForm({ session_name: '', category_id: '', notes: '' });
      qc.invalidateQueries({ queryKey: ['opname-sessions'], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['opname-items-agg'], refetchType: 'active' });
    },
    onError: (e: any) => toast.error(e.message || 'Gagal membuat session'),
  });

  return (
    <AccessControl allowedRoles={['admin', 'manager', 'staff']} resource="Stock Opname">
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6" /> Stock Opname
              </h1>
              <p className="text-sm text-muted-foreground">Verifikasi stok tanpa mengubah data inventori.</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Session Baru</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Buat Session Opname</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Nama Session</Label>
                    <Input value={form.session_name} onChange={(e) => setForm({ ...form, session_name: e.target.value })} placeholder="Opname Minuman Jan 2026" />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Catatan</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                  <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
                    {createMut.isPending ? 'Membuat...' : 'Buat Session'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Daftar Session</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Memuat...</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada session opname. Klik "Session Baru" untuk mulai.</p>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Produk</TableHead>
                        <TableHead className="text-right">Match</TableHead>
                        <TableHead className="text-right">Mismatch</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Petugas</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((s: any) => {
                        const a = aggBySession(s.id);
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.session_name}</TableCell>
                            <TableCell className="text-xs">{format(new Date(s.created_at), 'dd MMM yyyy')}</TableCell>
                            <TableCell>{s.categories?.name || '-'}</TableCell>
                            <TableCell><Badge variant={statusVariant[s.status] || 'secondary'}>{statusLabel[s.status] || s.status}</Badge></TableCell>
                            <TableCell className="text-right">{a.total}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">{a.match}</TableCell>
                            <TableCell className="text-right text-red-600 font-medium">{a.mismatch}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${a.progress}%` }} />
                                </div>
                                <span className="text-xs">{a.progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{s.profiles?.full_name || '-'}</TableCell>
                            <TableCell>
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/stock-opname/${s.id}`}>Buka</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

export default StockOpname;