
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, Package, AlertTriangle, Calendar } from 'lucide-react';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Query untuk produk dengan stok rendah
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['low-stock-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, current_stock, min_stock')
        .lt('current_stock', 'min_stock')
        .eq('is_active', true)
        .limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: 300000, // Refresh setiap 5 menit
  });

  // Query untuk pesanan baru
  const { data: newOrders = [] } = useQuery({
    queryKey: ['new-orders-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, status, created_at')
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh setiap 1 menit
  });

  // Query untuk transaksi kredit yang jatuh tempo
  const { data: overdueCredits = [] } = useQuery({
    queryKey: ['overdue-credits-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, 
          transaction_number, 
          total_amount, 
          due_date,
          customers(name)
        `)
        .eq('is_credit', true)
        .lt('due_date', new Date().toISOString().split('T')[0])
        .limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: 300000, // Refresh setiap 5 menit
  });

  const totalNotifications = lowStockProducts.length + newOrders.length + overdueCredits.length;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    return `${Math.floor(diffInHours / 24)} hari yang lalu`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-white">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          {totalNotifications > 0 && (
            <p className="text-xs text-gray-500">{totalNotifications} notifikasi baru</p>
          )}
        </div>

        {totalNotifications === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Tidak ada notifikasi baru</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {/* Notifikasi Stok Rendah */}
            {lowStockProducts.map((product) => (
              <DropdownMenuItem key={`stock-${product.id}`} className="p-3 cursor-pointer hover:bg-gray-50">
                <div className="flex items-start gap-3 w-full">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Stok Hampir Habis</p>
                    <p className="text-xs text-gray-500 truncate">
                      {product.name} - Sisa {product.current_stock} dari minimal {product.min_stock}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Peringatan stok</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            {/* Notifikasi Pesanan Baru */}
            {newOrders.map((order) => (
              <DropdownMenuItem key={`order-${order.id}`} className="p-3 cursor-pointer hover:bg-gray-50">
                <div className="flex items-start gap-3 w-full">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Pesanan Baru</p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.order_number} dari {order.customer_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(order.created_at)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            {/* Notifikasi Kredit Jatuh Tempo */}
            {overdueCredits.map((credit) => (
              <DropdownMenuItem key={`credit-${credit.id}`} className="p-3 cursor-pointer hover:bg-gray-50">
                <div className="flex items-start gap-3 w-full">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">Kredit Jatuh Tempo</p>
                    <p className="text-xs text-gray-500 truncate">
                      {credit.transaction_number} - {credit.customers?.name || 'Customer'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Jatuh tempo: {new Date(credit.due_date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {totalNotifications > 0 && (
          <div className="p-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-center text-xs"
              onClick={() => setIsOpen(false)}
            >
              Lihat Semua Notifikasi
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
