import { lazy, Suspense, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Star, ShoppingBag, Gift, Heart, Users, LogOut } from 'lucide-react';
import SEO from '@/components/SEO';

const ReferralSection = lazy(() => import('@/components/profile/ReferralSection'));

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const CustomerAccount = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [tab, setTab] = useState('info');

  // Customer record (single source of truth)
  const { data: customer } = useQuery({
    queryKey: ['account-customer', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_or_create_customer_for_current_user');
      if (error) throw error;
      const id = data as string;
      const { data: row } = await supabase.from('customers').select('*').eq('id', id).single();
      return row;
    },
    staleTime: 60_000,
    enabled: !!user?.id,
  });

  // Recent orders
  const { data: orders = [] } = useQuery({
    queryKey: ['account-orders', customer?.id],
    enabled: !!customer?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at')
        .eq('customer_id', customer!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  // Point transactions
  const { data: pointTxns = [] } = useQuery({
    queryKey: ['account-points', customer?.id],
    enabled: !!customer?.id && tab === 'rewards',
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('point_transactions')
        .select('id, points, transaction_type, description, created_at')
        .eq('customer_id', customer!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // Only buyers should access this page; staff roles go to admin dashboard.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (profile && profile.role && profile.role !== 'buyer') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <SEO title="Akun Saya — LAPAU.ID" description="Kelola akun, loyalti, pesanan, dan referral Anda di LAPAU.ID." path="/account" />
      <FrontendNavbar showSearch={false} />

      <main className="max-w-3xl mx-auto px-4 pt-20 pb-8 space-y-4">
        {/* Header card */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Avatar className="h-14 w-14">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.full_name} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary">
                {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{profile?.full_name || customer?.name || user.email}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              <Badge variant="secondary" className="mt-1 text-[10px]">Member</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => signOut()} aria-label="Keluar">
              <LogOut className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Loyalty summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card><CardContent className="p-3 text-center">
            <Star className="h-4 w-4 mx-auto text-yellow-500" />
            <div className="text-xs text-muted-foreground mt-1">Poin</div>
            <div className="font-semibold text-sm">{customer?.total_points ?? 0}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <ShoppingBag className="h-4 w-4 mx-auto text-primary" />
            <div className="text-xs text-muted-foreground mt-1">Belanja</div>
            <div className="font-semibold text-sm">{formatRupiah(Number(customer?.total_spent || 0))}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Gift className="h-4 w-4 mx-auto text-pink-500" />
            <div className="text-xs text-muted-foreground mt-1">Pesanan</div>
            <div className="font-semibold text-sm">{orders.length}</div>
          </CardContent></Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="info"><User className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Akun</span></TabsTrigger>
            <TabsTrigger value="orders"><ShoppingBag className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Pesanan</span></TabsTrigger>
            <TabsTrigger value="rewards"><Gift className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Reward</span></TabsTrigger>
            <TabsTrigger value="referral"><Users className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Referral</span></TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-3 mt-3">
            <Card><CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium">{profile?.full_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium truncate ml-2">{user.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">No. HP</span><span className="font-medium">{profile?.phone || customer?.phone || '-'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">Alamat</span><span className="font-medium text-right">{profile?.address || customer?.address || '-'}</span></div>
            </CardContent></Card>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/wishlist"><Button variant="outline" className="w-full"><Heart className="h-4 w-4 mr-1" /> Wishlist</Button></Link>
              <Link to="/order-history"><Button variant="outline" className="w-full"><ShoppingBag className="h-4 w-4 mr-1" /> Riwayat</Button></Link>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-3 space-y-2">
            {orders.length === 0 && (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Belum ada pesanan.</CardContent></Card>
            )}
            {orders.map((o: any) => (
              <Card key={o.id}><CardContent className="p-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('id-ID')}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatRupiah(Number(o.total_amount || 0))}</div>
                  <Badge variant="secondary" className="text-[10px]">{o.status}</Badge>
                </div>
              </CardContent></Card>
            ))}
            <Link to="/order-history"><Button variant="ghost" className="w-full text-sm">Lihat semua pesanan</Button></Link>
          </TabsContent>

          <TabsContent value="rewards" className="mt-3 space-y-2">
            <Card><CardContent className="p-4 text-center">
              <Star className="h-6 w-6 mx-auto text-yellow-500" />
              <div className="text-xs text-muted-foreground mt-1">Poin Saat Ini</div>
              <div className="text-2xl font-bold">{customer?.total_points ?? 0}</div>
              <Link to="/point-exchange"><Button size="sm" className="mt-2">Tukar Poin</Button></Link>
            </CardContent></Card>
            {pointTxns.length === 0 && (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Belum ada aktivitas poin.</CardContent></Card>
            )}
            {pointTxns.map((p: any) => (
              <Card key={p.id}><CardContent className="p-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{p.description || p.transaction_type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('id-ID')}</div>
                </div>
                <div className={`font-semibold ${p.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {p.points > 0 ? '+' : ''}{p.points}
                </div>
              </CardContent></Card>
            ))}
          </TabsContent>

          <TabsContent value="referral" className="mt-3">
            <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded" />}>
              <ReferralSection />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>

      <MinimalFooter />
    </div>
  );
};

export default CustomerAccount;