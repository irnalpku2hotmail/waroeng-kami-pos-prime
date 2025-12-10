import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Tag, Megaphone, Check, Trash2, Filter, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import FrontendCartModal from '@/components/frontend/FrontendCartModal';

const UserNotifications = () => {
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'price_drop') return notification.type === 'price_drop';
    if (activeTab === 'promo') return notification.type === 'promo' || notification.type === 'promotion';
    if (activeTab === 'unread') return !notification.is_read;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_drop':
        return <Tag className="h-5 w-5 text-green-500" />;
      case 'promo':
      case 'promotion':
        return <Megaphone className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'price_drop':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Harga Turun</Badge>;
      case 'promo':
      case 'promotion':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Promo</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.product_id) {
      navigate(`/product/${notification.product_id}`);
    }
  };

  const priceDropCount = notifications.filter(n => n.type === 'price_drop').length;
  const promoCount = notifications.filter(n => n.type === 'promo' || n.type === 'promotion').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FrontendNavbar 
        showSearch={false}
        onCartClick={() => setCartOpen(true)}
      />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline">Tandai Semua Dibaca</span>
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <Tag className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{priceDropCount}</p>
              <p className="text-xs text-green-600">Harga Turun</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <Megaphone className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-700">{promoCount}</p>
              <p className="text-xs text-orange-600">Promo</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <Bell className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{unreadCount}</p>
              <p className="text-xs text-blue-600">Belum Dibaca</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              Semua ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="price_drop" className="text-xs sm:text-sm">
              Harga Turun ({priceDropCount})
            </TabsTrigger>
            <TabsTrigger value="promo" className="text-xs sm:text-sm">
              Promo ({promoCount})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs sm:text-sm">
              Belum Dibaca ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-lg font-medium">Tidak ada notifikasi</p>
                  <p className="text-sm">Notifikasi harga turun dan promo akan muncul di sini</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      !notification.is_read && 'bg-blue-50/50 border-blue-200'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1 p-2 rounded-full bg-gray-100">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getNotificationBadge(notification.type)}
                                {!notification.is_read && (
                                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                )}
                              </div>
                              <h3 className={cn(
                                'text-base',
                                !notification.is_read && 'font-semibold'
                              )}>
                                {notification.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDistanceToNow(new Date(notification.created_at), { 
                                  addSuffix: true,
                                  locale: id 
                                })} • {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <MinimalFooter />
      <FrontendCartModal open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
};

export default UserNotifications;
