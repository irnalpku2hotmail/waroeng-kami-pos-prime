import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  customerId: string;
  customerPoints: number;
  onPointsHint?: () => void;
}

const statusVariant: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const RedemptionRequestList = ({ customerId, customerPoints }: Props) => {
  const qc = useQueryClient();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const { data: rewards = [] } = useQuery({
    queryKey: ['account-rewards'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('id, name, description, stock_quantity, reward_items(points_required)')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name');
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        points_required: (r.reward_items || []).reduce(
          (s: number, it: any) => s + (it.points_required || 0),
          0
        ),
      }));
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['account-redemption-requests', customerId],
    enabled: !!customerId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_redemption_requests')
        .select('id, status, points_used, quantity, notes, review_notes, requested_at, reviewed_at, rewards(name)')
        .eq('customer_id', customerId)
        .order('requested_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const submit = useMutation({
    mutationFn: async (reward: any) => {
      setSubmittingId(reward.id);
      const { error } = await supabase.from('reward_redemption_requests').insert({
        customer_id: customerId,
        reward_id: reward.id,
        points_used: reward.points_required,
        quantity: 1,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-redemption-requests', customerId] });
      toast({ title: 'Pengajuan terkirim', description: 'Menunggu persetujuan admin.' });
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
    onSettled: () => setSubmittingId(null),
  });

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Gift className="h-4 w-4 text-pink-500" /> Ajukan Penukaran Poin
        </h3>
        {rewards.length === 0 && (
          <Card><CardContent className="p-4 text-center text-xs text-muted-foreground">
            Belum ada reward tersedia.
          </CardContent></Card>
        )}
        <div className="space-y-2">
          {rewards.map((r: any) => {
            const canAfford = customerPoints >= r.points_required;
            return (
              <Card key={r.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{r.name}</div>
                    {r.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">{r.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="flex items-center gap-0.5 text-yellow-600 font-semibold">
                        <Star className="h-3 w-3 fill-current" /> {r.points_required} poin
                      </span>
                      <Badge variant="secondary" className="text-[10px]">Stok {r.stock_quantity}</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => submit.mutate(r)}
                    disabled={!canAfford || submittingId === r.id}
                    className="bg-[#03AC0E] hover:bg-[#028A0B]"
                  >
                    {submittingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ajukan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {requests.length > 0 && (
        <div className="pt-2">
          <h3 className="text-sm font-semibold mb-2">Riwayat Pengajuan</h3>
          <div className="space-y-2">
            {requests.map((req: any) => (
              <Card key={req.id}>
                <CardContent className="p-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{req.rewards?.name || 'Reward'}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(req.requested_at).toLocaleString('id-ID')}
                    </div>
                    {req.review_notes && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">Catatan: {req.review_notes}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-xs font-semibold text-red-600">-{req.points_used} poin</div>
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${statusVariant[req.status] || 'bg-gray-100 text-gray-800'}`}>
                      {req.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RedemptionRequestList;