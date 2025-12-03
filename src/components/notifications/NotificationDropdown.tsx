import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const NotificationDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.product_id) {
      navigate(`/product/${notification.product_id}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_drop':
        return <Tag className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2 hover:bg-blue-50">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-xs bg-red-500 hover:bg-red-600 px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifikasi</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => markAllAsRead()}
            >
              <Check className="h-3 w-3 mr-1" />
              Tandai semua dibaca
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Belum ada notifikasi</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors',
                  !notification.is_read && 'bg-blue-50/50'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm',
                      !notification.is_read && 'font-medium'
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { 
                        addSuffix: true,
                        locale: id 
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
