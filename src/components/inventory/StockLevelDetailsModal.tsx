
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CalendarIcon } from 'lucide-react';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface StockLevelDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

const StockLevelDetailsModal = ({ open, onOpenChange, product }: StockLevelDetailsModalProps) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'custom'>('week');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });

  const { startDate, endDate } = useMemo(() => {
    if (timeRange === 'custom' && dateRange?.from) {
      return {
        startDate: startOfDay(dateRange.from),
        endDate: dateRange.to ? startOfDay(dateRange.to) : startOfDay(new Date())
      };
    }
    const daysBack = timeRange === 'week' ? 7 : 30;
    return {
      startDate: subDays(new Date(), daysBack),
      endDate: new Date()
    };
  }, [timeRange, dateRange]);

  // Fetch sales data for the product
  const { data: salesData = [] } = useQuery({
    queryKey: ['product-sales', product?.id, timeRange, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity,
          total_price,
          created_at,
          transactions(created_at)
        `)
        .eq('product_id', product.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (error) throw error;

      // Create all days in range
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Group by date
      const grouped = data?.reduce((acc: Record<string, { quantity: number; revenue: number }>, item: any) => {
        const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
          acc[dateKey] = { quantity: 0, revenue: 0 };
        }
        acc[dateKey].quantity += Number(item.quantity) || 0;
        acc[dateKey].revenue += Number(item.total_price) || 0;
        return acc;
      }, {} as Record<string, { quantity: number; revenue: number }>);

      // Fill all days with data (0 for missing days)
      return allDays.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const displayDate = format(day, 'd MMM', { locale: id });
        return {
          date: displayDate,
          fullDate: dateKey,
          quantity: grouped?.[dateKey]?.quantity || 0,
          revenue: grouped?.[dateKey]?.revenue || 0
        };
      });
    },
    enabled: !!product?.id
  });

  // Fetch purchase history
  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['product-purchases', product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          *,
          purchases(purchase_date, supplier_id, suppliers(name))
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.id
  });

  // Fetch stock adjustments
  const { data: stockAdjustments = [] } = useQuery({
    queryKey: ['product-adjustments', product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.id
  });

  if (!product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStockStatus = () => {
    const stock = Number(product.current_stock) || 0;
    const minStock = Number(product.min_stock) || 0;
    
    if (stock === 0) return { status: 'Habis', color: 'destructive' };
    if (stock <= minStock) return { status: 'Rendah', color: 'destructive' };
    if (stock <= minStock * 2) return { status: 'Sedang', color: 'secondary' };
    return { status: 'Aman', color: 'default' };
  };

  const expiringItems = purchaseHistory.filter(item => {
    if (!item.expiration_date) return false;
    const expDate = new Date(item.expiration_date);
    const today = new Date();
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detail Stok: {product.name}
            <Badge variant={getStockStatus().color as any}>
              {getStockStatus().status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Penjualan</TabsTrigger>
            <TabsTrigger value="purchases">Pembelian</TabsTrigger>
            <TabsTrigger value="adjustments">Penyesuaian</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Stok Saat Ini</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{product.current_stock}</div>
                  <div className="text-sm text-muted-foreground">Min: {product.min_stock}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Harga Jual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(product.selling_price)}</div>
                  <div className="text-sm text-muted-foreground">Base: {formatCurrency(product.base_price)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{product.categories?.name || 'Tidak ada'}</div>
                  <div className="text-sm text-muted-foreground">Unit: {product.units?.abbreviation || 'pcs'}</div>
                </CardContent>
              </Card>
            </div>

            {expiringItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Item Mendekati Kadaluarsa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiringItems.map((item, index) => {
                      const expDate = new Date(item.expiration_date);
                      const today = new Date();
                      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-2 bg-destructive/10 rounded-lg">
                          <span>Qty: {item.quantity}</span>
                          <span className="text-destructive font-medium">
                            {diffDays} hari lagi ({expDate.toLocaleDateString('id-ID')})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button
                variant={timeRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('week')}
              >
                7 Hari
              </Button>
              <Button
                variant={timeRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('month')}
              >
                30 Hari
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={timeRange === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => setTimeRange('custom')}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {timeRange === 'custom' && dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "d MMM", { locale: id })} - {format(dateRange.to, "d MMM", { locale: id })}
                        </>
                      ) : (
                        format(dateRange.from, "d MMM yyyy", { locale: id })
                      )
                    ) : (
                      'Custom'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      if (range?.from) setTimeRange('custom');
                    }}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Grafik Penjualan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorQuantity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number) => [value, 'Quantity']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="quantity" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#colorQuantity)"
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Pendapatan</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#10B981' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Pembelian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {purchaseHistory.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">Qty: {item.quantity}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.purchases?.suppliers?.name} - {new Date(item.purchases?.purchase_date).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(item.total_cost)}</div>
                        {item.expiration_date && (
                          <div className="text-sm text-muted-foreground">
                            Exp: {new Date(item.expiration_date).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adjustments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Penyesuaian Stok</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stockAdjustments.map((adjustment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          {adjustment.adjustment_type === 'increase' ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                          <span className="font-medium">
                            {adjustment.adjustment_type === 'increase' ? '+' : ''}
                            {adjustment.quantity_change}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {adjustment.profiles?.full_name} - {new Date(adjustment.created_at).toLocaleDateString('id-ID')}
                        </div>
                        {adjustment.reason && (
                          <div className="text-sm text-muted-foreground">{adjustment.reason}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {adjustment.previous_stock} → {adjustment.new_stock}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StockLevelDetailsModal;
