
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Package, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeFooter from '@/components/home/HomeFooter';

const Notifications = () => {
  // Mock notifications data - in real app, this would come from database
  const notifications = [
    {
      id: 1,
      type: 'order',
      title: 'Pesanan Anda telah dikonfirmasi',
      message: 'Pesanan #ORD000123 telah dikonfirmasi dan sedang diproses',
      time: '2 jam yang lalu',
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'delivery',
      title: 'Pesanan sedang dikirim',
      message: 'Pesanan #ORD000122 sedang dalam perjalanan',
      time: '5 jam yang lalu',
      read: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'promotion',
      title: 'Flash Sale 50%',
      message: 'Jangan lewatkan flash sale hari ini dengan diskon hingga 50%',
      time: '1 hari yang lalu',
      read: true,
      priority: 'low'
    },
    {
      id: 4,
      type: 'system',
      title: 'Sistem maintenance',
      message: 'Sistem akan maintenance pada malam ini pukul 23:00-02:00',
      time: '2 hari yang lalu',
      read: true,
      priority: 'medium'
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-5 w-5 text-blue-500" />;
      case 'delivery':
        return <Package className="h-5 w-5 text-green-500" />;
      case 'promotion':
        return <Bell className="h-5 w-5 text-purple-500" />;
      case 'system':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Bell className="h-6 w-6 mr-2" />
              Notifikasi
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-500">
                {unreadCount} belum dibaca
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={getPriorityColor(notification.priority)}
                        >
                          {notification.priority}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {notification.time}
                      </span>
                      {notification.read && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Tidak ada notifikasi
            </p>
          </div>
        )}
      </div>

      <HomeFooter />
    </div>
  );
};

export default Notifications;
