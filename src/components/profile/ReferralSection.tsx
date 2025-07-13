
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Users, Gift, Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReferralCode {
  id: string;
  code: string;
  points_earned: number;
  total_referrals: number;
  is_active: boolean;
}

interface ReferralHistory {
  id: string;
  referred_user_id: string;
  referral_code: string;
  points_awarded: number;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const ReferralSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: referralCode } = useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ReferralCode | null;
    },
    enabled: !!user?.id,
  });

  const { data: referralHistory = [] } = useQuery({
    queryKey: ['referral-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('referral_history')
        .select(`
          *,
          profiles!referral_history_referred_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReferralHistory[];
    },
    enabled: !!user?.id,
  });

  const createReferralCodeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not found');

      const { data: codeResult } = await supabase.rpc('generate_referral_code');
      
      const { error } = await supabase
        .from('referral_codes')
        .insert({
          user_id: user.id,
          code: codeResult,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-code'] });
      toast({ title: 'Kode referral berhasil dibuat!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Kode berhasil disalin!' });
  };

  const shareReferral = (code: string) => {
    const url = `${window.location.origin}/register?ref=${code}`;
    const text = `Bergabunglah dengan kami menggunakan kode referral saya: ${code}. Daftar di: ${url}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Kode Referral',
        text: text,
        url: url,
      });
    } else {
      copyToClipboard(text);
    }
  };

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Total Referral</p>
                <p className="text-2xl font-bold">{referralCode?.total_referrals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Poin Terkumpul</p>
                <p className="text-2xl font-bold">{referralCode?.points_earned || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Share2 className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Status</p>
                <p className="text-lg font-bold">
                  {referralCode?.is_active ? 'Aktif' : 'Tidak Aktif'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>Kode Referral Anda</CardTitle>
        </CardHeader>
        <CardContent>
          {referralCode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Input 
                  value={referralCode.code} 
                  readOnly 
                  className="font-mono text-lg text-center"
                />
                <Button 
                  onClick={() => copyToClipboard(referralCode.code)}
                  variant="outline"
                  size="icon"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => shareReferral(referralCode.code)}
                  variant="default"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Bagikan
                </Button>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Cara menggunakan:</strong> Bagikan kode ini kepada teman-teman Anda. 
                  Ketika mereka mendaftar menggunakan kode ini, Anda akan mendapatkan 10 poin bonus!
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Anda belum memiliki kode referral</p>
              <Button 
                onClick={() => createReferralCodeMutation.mutate()}
                disabled={createReferralCodeMutation.isPending}
              >
                {createReferralCodeMutation.isPending ? 'Membuat...' : 'Buat Kode Referral'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Referral</CardTitle>
        </CardHeader>
        <CardContent>
          {referralHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Belum ada riwayat referral
            </p>
          ) : (
            <div className="space-y-3">
              {referralHistory.map((history) => (
                <div key={history.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {history.profiles?.full_name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {history.profiles?.email || ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(history.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-800">
                      +{history.points_awarded} poin
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {history.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSection;
