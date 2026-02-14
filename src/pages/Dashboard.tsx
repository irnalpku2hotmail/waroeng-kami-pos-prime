import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, Users, ShoppingCart, DollarSign,
  TrendingUp, TrendingDown, AlertTriangle, History,
  Wifi, Calendar, Clock
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePresence } from '@/contexts/PresenceContext';

const Dashboard = () => {
  const { onlineUsers } = usePresence();

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const startOfTodayISO = startOfToday.toISOString();
  const endOfTodayISO = endOfToday.toISOString();

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').lt('current_stock', 10);
      if (error) throw error;
      return data;
    }
  });

  const { data: expiredProducts } = useQuery({
    queryKey: ['expired-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_items')
        .select('product_id, expiration_date')
        .not('expiration_date', 'is', null)
        .lt('expiration_date', todayString);
      if (error) throw error;
      const uniqueProducts = new Set(data?.map(item => item.product_id) || []);
      return Array.from(uniqueProducts);
    }
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: todayOrders } = useQuery({
    queryKey: ['today-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders').select('*')
        .gte('created_at', startOfTodayISO)
        .lte('created_at', endOfTodayISO);
      if (error) throw error;
      return data;
    }
  });

  const { data: posSales } = useQuery({
    queryKey: ['pos-daily-sales', todayString],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, transaction_number, total_amount, customer_id, created_at')
        .gte('created_at', startOfTodayISO)
        .lte('created_at', endOfTodayISO);
      if (error) throw error;
      return data;
    }
  });

  const { data: codSalesToday } = useQuery({
    queryKey: ['cod-revenue-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, customer_id, customer_name, created_at, status')
        .eq('status', 'delivered')
        .gte('delivery_date', startOfTodayISO)
        .lte('delivery_date', endOfTodayISO);
      if (error) throw error;
      return data;
    }
  });

  const totalProducts = products?.length || 0;
  const lowStockProducts = lowStock?.length || 0;
  const expiredProductsCount = expiredProducts?.length || 0;
  const totalCustomers = customers?.length || 0;
  const todayOrdersCount = todayOrders?.length || 0;

  const todaySales = posSales?.reduce((sum, trx) => sum + (Number(trx.total_amount) || 0), 0) || 0;
  const todayTransactions = posSales?.length || 0;
  const codIncomeToday = codSalesToday?.reduce((sum, trx) => sum + (Number(trx.total_amount) || 0), 0) || 0;

  const todaySalesTable = (posSales ?? []).map(trx => {
    let customerName = 'Umum';
    if (trx.customer_id) {
      const matchCustomer = customers?.find((c) => c.id === trx.customer_id);
      customerName = matchCustomer?.name || 'Umum';
    }
    return {
      id: trx.id, number: trx.transaction_number,
      name: customerName, total: trx.total_amount,
      status: 'POS', created_at: trx.created_at,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const codSalesTable = (codSalesToday ?? []).map(trx => ({
    id: trx.id, number: trx.order_number,
    name: trx.customer_name || 'Umum', total: trx.total_amount,
    status: trx.status, created_at: trx.created_at,
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getOrderStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      case 'processing':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Diproses</Badge>;
      case 'shipped':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Dikirim</Badge>;
      default:
        return <Badge>{String(status || '')}</Badge>;
    }
  };

  const statCards = [
    { title: 'User Online', value: String(onlineUsers || 0), sub: 'User aktif login', icon: Wifi, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
    { title: 'Total Produk', value: String(totalProducts), sub: 'Produk tersedia', icon: Package, color: 'text-primary', iconBg: 'bg-primary/10' },
    { title: 'Stok Menipis', value: String(lowStockProducts), sub: 'Produk < 10 stok', icon: AlertTriangle, color: 'text-amber-600', iconBg: 'bg-amber-50' },
    { title: 'Produk Kadaluarsa', value: String(expiredProductsCount), sub: 'Produk expired', icon: Clock, color: 'text-destructive', iconBg: 'bg-red-50' },
    { title: 'Total Pelanggan', value: String(totalCustomers), sub: 'Pelanggan terdaftar', icon: Users, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
    { title: 'Pesanan Hari Ini', value: String(todayOrdersCount), sub: 'Pesanan masuk', icon: Calendar, color: 'text-primary', iconBg: 'bg-primary/10' },
    { title: 'Penjualan Hari Ini', value: `Rp ${todaySales?.toLocaleString('id-ID') || '0'}`, sub: `Dari ${String(todayTransactions)} transaksi POS`, icon: DollarSign, color: 'text-violet-600', iconBg: 'bg-violet-50' },
    { title: 'Pendapatan COD', value: `Rp ${codIncomeToday?.toLocaleString('id-ID') || '0'}`, sub: 'COD delivered hari ini', icon: TrendingUp, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ringkasan bisnis Anda hari ini</p>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="rounded-2xl border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                    <div className={`h-8 w-8 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${card.color}`}>{card.value}</div>
                  <p className="text-[11px] text-muted-foreground mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <History className="h-3.5 w-3.5 text-primary" />
                </div>
                Transaksi POS Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-xs text-muted-foreground font-medium">No. Transaksi</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Pelanggan</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Tipe</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySalesTable.length > 0 ? (
                    todaySalesTable.map(order => (
                      <TableRow key={order.id} className="border-border/30 hover:bg-accent/50 transition-colors">
                        <TableCell className="font-medium text-xs">{String(order.number || '')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{String(order.name || '')}</TableCell>
                        <TableCell className="text-xs"><Badge variant="secondary" className="text-[10px] px-2 py-0.5">POS</Badge></TableCell>
                        <TableCell className="text-right text-xs font-medium">Rp {String(Number(order.total)?.toLocaleString('id-ID') || 0)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center text-xs text-muted-foreground">
                        Tidak ada transaksi POS hari ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <History className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                Transaksi COD Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-xs text-muted-foreground font-medium">No. Order</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Pelanggan</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codSalesTable.length > 0 ? (
                    codSalesTable.map(order => (
                      <TableRow key={order.id} className="border-border/30 hover:bg-accent/50 transition-colors">
                        <TableCell className="font-medium text-xs">{String(order.number || '')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{String(order.name || '')}</TableCell>
                        <TableCell className="text-xs">{getOrderStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right text-xs font-medium">Rp {String(Number(order.total)?.toLocaleString('id-ID') || 0)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center text-xs text-muted-foreground">
                        Tidak ada transaksi COD selesai hari ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
