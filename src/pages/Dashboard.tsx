
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  History,
  Wifi,
  Calendar,
  Clock
} from 'lucide-react';
import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { usePresence } from '@/contexts/PresenceContext';

const Dashboard = () => {
  const { onlineUsers } = usePresence();

  // Get today's date in YYYY-MM-DD format for filtering
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const startOfToday = `${todayString}T00:00:00.000Z`;
  const endOfToday = `${todayString}T23:59:59.999Z`;

  // Total produk
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Produk stok rendah
  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .lt('current_stock', 10);
      if (error) throw error;
      return data;
    }
  });

  // Produk kadaluarsa (berdasarkan purchase_items dengan tanggal kadaluarsa)
  const { data: expiredProducts } = useQuery({
    queryKey: ['expired-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_items')
        .select('product_id, expiration_date')
        .not('expiration_date', 'is', null)
        .lt('expiration_date', todayString);
      if (error) throw error;
      // Count unique products that are expired
      const uniqueProducts = new Set(data?.map(item => item.product_id) || []);
      return Array.from(uniqueProducts);
    }
  });

  // Total pelanggan
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Pesanan masuk hari ini
  const { data: todayOrders } = useQuery({
    queryKey: ['today-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);
      if (error) throw error;
      return data;
    }
  });

  // Transaksi POS hari ini (fixed calculation)
  const { data: posSales } = useQuery({
    queryKey: ['pos-daily-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, transaction_number, total_amount, customer_id, created_at')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);
      if (error) throw error;
      return data;
    }
  });

  // COD: Pendapatan COD hari ini (orders delivered hari ini)
  const { data: codSalesToday } = useQuery({
    queryKey: ['cod-revenue-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, customer_id, customer_name, created_at, status')
        .eq('status', 'delivered')
        .gte('delivery_date', startOfToday)
        .lte('delivery_date', endOfToday);
      if (error) throw error;
      return data;
    }
  });

  // Calculate statistics
  const totalProducts = products?.length || 0;
  const lowStockProducts = lowStock?.length || 0;
  const expiredProductsCount = expiredProducts?.length || 0;
  const totalCustomers = customers?.length || 0;
  const todayOrdersCount = todayOrders?.length || 0;

  // Calculate today's POS sales
  const todaySales = posSales?.reduce((sum, trx) => sum + (Number(trx.total_amount) || 0), 0) || 0;
  const todayTransactions = posSales?.length || 0;

  // Calculate COD income today
  const codIncomeToday = codSalesToday?.reduce((sum, trx) => sum + (Number(trx.total_amount) || 0), 0) || 0;

  // Prepare sales table data
  const todaySalesTable = (posSales ?? []).map(trx => {
    let customerName = 'Umum';
    if (trx.customer_id) {
      const matchCustomer = customers?.find((c) => c.id === trx.customer_id);
      customerName = matchCustomer?.name || 'Umum';
    }
    return {
      id: trx.id,
      number: trx.transaction_number,
      name: customerName,
      total: trx.total_amount,
      status: 'POS',
      created_at: trx.created_at,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // COD Sales Table Today
  const codSalesTable = (codSalesToday ?? []).map(trx => ({
    id: trx.id,
    number: trx.order_number,
    name: trx.customer_name || 'Umum',
    total: trx.total_amount,
    status: trx.status,
    created_at: trx.created_at,
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getOrderStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Diproses</Badge>;
      case 'shipped':
        return <Badge className="bg-yellow-100 text-yellow-800">Dikirim</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-blue-800 mb-2">Dashboard</h1>
        
        {/* Statistics Cards - 8 cards in 2 rows */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">User Online</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-green-600">{onlineUsers}</div>
              <p className="text-[10px] text-muted-foreground">User aktif</p>
            </CardContent>
          </Card>
          
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-blue-600">{totalProducts}</div>
              <p className="text-[10px] text-muted-foreground">Produk tersedia</p>
            </CardContent>
          </Card>
          
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Stok Menipis</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-orange-600">{lowStockProducts}</div>
              <p className="text-[10px] text-muted-foreground">Produk &lt; 10 stok</p>
            </CardContent>
          </Card>
          
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Produk Kadaluarsa</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-red-600">{expiredProductsCount}</div>
              <p className="text-[10px] text-muted-foreground">Produk expired</p>
            </CardContent>
          </Card>
          
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Total Pelanggan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-green-600">{totalCustomers}</div>
              <p className="text-[10px] text-muted-foreground">Pelanggan terdaftar</p>
            </CardContent>
          </Card>
          
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Pesanan Hari Ini</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-blue-600">{todayOrdersCount}</div>
              <p className="text-[10px] text-muted-foreground">Pesanan masuk</p>
            </CardContent>
          </Card>
          
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Penjualan Hari Ini</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-purple-600">
                Rp {todaySales?.toLocaleString('id-ID') || '0'}
              </div>
              <p className="text-[10px] text-muted-foreground">Dari {todayTransactions} transaksi</p>
            </CardContent>
          </Card>
          
          <Card className="px-3 py-2">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-1">
              <CardTitle className="text-xs font-semibold">Pendapatan COD Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pb-1">
              <div className="text-lg font-bold text-green-600">
                Rp {codIncomeToday?.toLocaleString('id-ID') || '0'}
              </div>
              <p className="text-[10px] text-muted-foreground">COD delivered hari ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Transaksi Penjualan Hari Ini (POS saja) */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5 text-blue-500" />
                Transaksi Penjualan Hari Ini (POS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">No. Transaksi</TableHead>
                    <TableHead className="text-xs">Pelanggan</TableHead>
                    <TableHead className="text-xs">Tipe</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaySalesTable.length > 0 ? (
                    todaySalesTable.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-xs">{order.number}</TableCell>
                        <TableCell className="text-xs">{order.name}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary">
                            POS
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          Rp {Number(order.total)?.toLocaleString('id-ID') || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center text-xs">
                        Tidak ada transaksi POS hari ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Transaksi COD Hari Ini */}
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5 text-green-500" />
                Transaksi COD Hari Ini (Selesai)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">No. Order</TableHead>
                    <TableHead className="text-xs">Pelanggan</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codSalesTable.length > 0 ? (
                    codSalesTable.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-xs">{order.number}</TableCell>
                        <TableCell className="text-xs">{order.name}</TableCell>
                        <TableCell className="text-xs">
                          {getOrderStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          Rp {Number(order.total)?.toLocaleString('id-ID') || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-16 text-center text-xs">
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
