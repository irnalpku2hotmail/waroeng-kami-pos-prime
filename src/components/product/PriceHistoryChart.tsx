import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PriceHistoryChartProps {
  productId: string;
  currentPrice: number;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ productId, currentPrice }) => {
  const { data: priceHistory = [], isLoading } = useQuery({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', productId)
        .order('changed_at', { ascending: true });

      if (error) {
        console.error('Error fetching price history:', error);
        return [];
      }

      return data || [];
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Transform data for the chart - include current price as the latest point
  const chartData = React.useMemo(() => {
    if (priceHistory.length === 0) return [];

    const data = priceHistory.map((item) => ({
      date: format(new Date(item.changed_at), 'dd MMM', { locale: id }),
      fullDate: format(new Date(item.changed_at), 'dd MMM yyyy HH:mm', { locale: id }),
      price: item.new_price,
      oldPrice: item.old_price,
    }));

    // Add current price as the last data point
    data.push({
      date: 'Sekarang',
      fullDate: 'Harga Saat Ini',
      price: currentPrice,
      oldPrice: priceHistory[priceHistory.length - 1]?.new_price || currentPrice,
    });

    return data;
  }, [priceHistory, currentPrice]);

  // Calculate price trend
  const priceTrend = React.useMemo(() => {
    if (priceHistory.length === 0) return { type: 'stable', percentage: 0 };
    
    const firstPrice = priceHistory[0].old_price;
    const change = ((currentPrice - firstPrice) / firstPrice) * 100;
    
    if (change > 0) return { type: 'up', percentage: change };
    if (change < 0) return { type: 'down', percentage: Math.abs(change) };
    return { type: 'stable', percentage: 0 };
  }, [priceHistory, currentPrice]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm text-muted-foreground">{payload[0]?.payload?.fullDate}</p>
          <p className="text-sm font-semibold text-primary">
            {formatPrice(payload[0]?.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Riwayat Harga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Minus className="h-5 w-5 text-muted-foreground" />
            Riwayat Harga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Belum ada perubahan harga tercatat</p>
            <p className="text-sm mt-1">Harga saat ini: {formatPrice(currentPrice)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {priceTrend.type === 'down' && <TrendingDown className="h-5 w-5 text-green-500" />}
            {priceTrend.type === 'up' && <TrendingUp className="h-5 w-5 text-red-500" />}
            {priceTrend.type === 'stable' && <Minus className="h-5 w-5 text-muted-foreground" />}
            Riwayat Harga
          </CardTitle>
          {priceTrend.type !== 'stable' && (
            <span className={`text-sm font-medium ${priceTrend.type === 'down' ? 'text-green-500' : 'text-red-500'}`}>
              {priceTrend.type === 'down' ? '↓' : '↑'} {priceTrend.percentage.toFixed(1)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-muted-foreground text-center">
          {priceHistory.length} perubahan harga tercatat
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceHistoryChart;
