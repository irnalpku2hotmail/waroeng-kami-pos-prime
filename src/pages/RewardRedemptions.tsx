import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Gift, Check, X, Loader2, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const RewardRedemptions = () => {
  const qc = useQueryClient();
  const [statusTab, setStatusTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-redemption-requests', statusTab],
    queryFn: async () => {
      let q = supabase
        .from('reward_redemption_requests')
        .select(
          'id, status, points_used, quantity, notes, review_notes, requested_at, reviewed_at, reviewed_by, customers(id, name, email, phone, total_points), rewards(id, name, stock_quantity)'
        )
        .order('requested_at', { ascending: false })
        .limit(100);
      if (statusTab !== 'all') q = q.eq('status', statusTab);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const review = useMutation({
    mutationFn: async () => {
      if (!reviewing || !reviewAction) return;
      const rpc = reviewAction === 'approve' ? 'approve_reward_redemption' : 'reject_reward_redemption';
      const { error } = await supabase.rpc(rpc, {
        p_request_id: reviewing.id,
        p_review_notes: reviewNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-redemption-requests'] });
      toast({ title: 'Berhasil', description: reviewAction === 'approve' ? 'Pengajuan disetujui.' : 'Pengajuan ditolak.' });
      setReviewing(null);
      setReviewAction(null);
      setReviewNotes('');
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const openReview = (req: any, action: 'approve' | 'reject') => {
    setReviewing(req);
    setReviewAction(action);
    setReviewNotes('');
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gift className="h-6 w-6 text-pink-500" /> Pengajuan Penukaran Poin
            </h1>
            <p className="text-sm text-muted-foreground">Setujui atau tolak pengajuan reward dari customer.</p>
          </div>
        </div>

        <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as any)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">Semua</TabsTrigger>
          </TabsList>

          <TabsContent value={statusTab} className="mt-4">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </div>
            ) : requests.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                Tidak ada pengajuan.
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {requests.map((req: any) => (
                  <Card key={req.id}>
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{req.customers?.name || 'Customer'}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status]}`}>{req.status}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(req.requested_at).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="text-sm mt-1">
                          Reward: <span className="font-medium">{req.rewards?.name}</span> ×{req.quantity}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 text-yellow-700">
                            <Star className="h-3 w-3 fill-current" /> {req.points_used} poin
                          </span>
                          <span>Saldo customer: {req.customers?.total_points ?? 0}</span>
                          <span>Stok reward: {req.rewards?.stock_quantity ?? 0}</span>
                        </div>
                        {req.review_notes && (
                          <div className="text-xs mt-1 text-muted-foreground">Catatan: {req.review_notes}</div>
                        )}
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => openReview(req, 'approve')} className="bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openReview(req, 'reject')}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!reviewing} onOpenChange={(o) => { if (!o) { setReviewing(null); setReviewAction(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Setujui pengajuan' : 'Tolak pengajuan'}
            </DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Customer:</span>{' '}
                <span className="font-medium">{reviewing.customers?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Reward:</span>{' '}
                <span className="font-medium">{reviewing.rewards?.name}</span> ({reviewing.points_used} poin)
              </div>
              {reviewAction === 'approve' && (
                <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  Poin customer akan dikurangi dan stok reward akan berkurang setelah disetujui.
                </div>
              )}
              <Textarea
                placeholder="Catatan review (opsional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReviewing(null); setReviewAction(null); }}>Batal</Button>
            <Button
              onClick={() => review.mutate()}
              disabled={review.isPending}
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {review.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (reviewAction === 'approve' ? 'Setujui' : 'Tolak')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default RewardRedemptions;