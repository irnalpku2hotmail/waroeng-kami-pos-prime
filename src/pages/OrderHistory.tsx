
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Clock, CheckCircle, XCircle, Truck, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import HomeNavbar from '@/components/home/HomeNavbar';
import EnhancedFooter from '@/components/home/EnhancedFooter';
import CartModal from '@/components/CartModal';
import { useNavigate } from 'react-router-dom';

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user's orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      if (!user?.email) return [];

      // First get customer by email
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customer) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, image_url)
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <HomeNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Riwayat Pesanan
            </h1>
            <p className="text-gray-600">Pantau status pesanan Anda di sini</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* No Orders */}
        {!isLoading && orders.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-white/20 max-w-md mx-auto">
              <Package className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Belum Ada Pesanan
              </h3>
              <p className="text-gray-600 mb-6">
                Anda belum memiliki riwayat pesanan. Mulai berbelanja sekarang!
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
              >
                Mulai Berbelanja
              </Button>
            </div>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-800 mb-2">
                        Pesanan #{order.order_number}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(order.order_date), 'dd MMMM yyyy', { locale: id })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {order.customer_address?.substring(0, 30)}...
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`px-4 py-2 text-sm font-medium border ${getStatusColor(order.status)}`}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </Badge>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Item Pesanan:</h4>
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                          {item.products?.image_url ? (
                            <img 
                              src={item.products.image_url} 
                              alt={item.products.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-800 mb-1">
                            {item.products?.name || 'Produk'}
                          </h5>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Qty: {item.quantity}</span>
                            <span>@{formatPrice(item.unit_price)}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-gray-800">
                            {formatPrice(item.total_price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 mb-3">Informasi Pengiriman:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-700">{order.customer_name}</p>
                            <p className="text-gray-600">{order.customer_address}</p>
                          </div>
                        </div>
                        {order.customer_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">{order.customer_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 mb-3">Detail Pembayaran:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-800">{formatPrice(order.total_amount - order.delivery_fee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ongkir:</span>
                          <span className="text-gray-800">{formatPrice(order.delivery_fee)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                          <span>Total:</span>
                          <span className="text-blue-600">{formatPrice(order.total_amount)}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Badge variant="outline" className="capitalize">
                            {order.payment_method}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="mt-6 p-4 bg-blue-50/50 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-2">Catatan Pesanan:</h4>
                      <p className="text-gray-600 text-sm">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EnhancedFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default OrderHistory;
