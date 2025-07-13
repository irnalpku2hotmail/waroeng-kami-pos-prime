
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, Truck, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  order_date: string;
  order_items: {
    id: string;
    quantity: number;
    products: {
      name: string;
      image_url: string | null;
    };
  }[];
}

const OrderHistory = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          total_amount,
          status,
          order_date,
          order_items (
            id,
            quantity,
            products (
              name,
              image_url
            )
          )
        `)
        .order('order_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Order[];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Riwayat Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Riwayat Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">Belum ada pesanan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Riwayat Pesanan Terbaru</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <span className="font-medium text-sm">{order.order_number}</span>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{order.customer_name}</span>
              <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{new Date(order.order_date).toLocaleDateString('id-ID')}</span>
              <span>•</span>
              <span>{order.order_items.length} item(s)</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OrderHistory;
