
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';
import CartModal from '@/components/CartModal';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['order-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'processing': return 'Diproses';
      case 'shipped': return 'Dikirim';
      case 'delivered': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HomeNavbar 
          onCartClick={() => setCartModalOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
        />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Silakan login untuk melihat riwayat pesanan</p>
          </div>
        </div>
        <HomeFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Riwayat Pesanan
          </h1>
          <p className="text-gray-600">
            Lihat semua pesanan yang pernah Anda buat
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Memuat riwayat pesanan...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada pesanan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Pesanan #{order.order_number}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {formatPrice(order.total_amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.payment_method === 'cod' ? 'COD' : 'Transfer'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2">Informasi Penerima</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>{order.customer_name}</p>
                        {order.customer_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.customer_phone}
                          </div>
                        )}
                        {order.customer_address && (
                          <div className="flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{order.customer_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {order.notes && (
                      <div>
                        <h4 className="font-medium mb-2">Catatan</h4>
                        <p className="text-sm text-gray-600">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Produk Pesanan</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            {item.products.image_url ? (
                              <img 
                                src={item.products.image_url} 
                                alt={item.products.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.products.name}</p>
                            <p className="text-xs text-gray-600">
                              {item.quantity} x {formatPrice(item.unit_price)}
                            </p>
                          </div>
                          <p className="font-medium text-sm text-blue-600">
                            {formatPrice(item.total_price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <HomeFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default OrderHistory;
