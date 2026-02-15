import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onCartClick?: () => void;
  onAuthClick?: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onCartClick, onAuthClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getTotalItems } = useCart();

  const navItems = [
    {
      icon: Home,
      label: 'Beranda',
      path: '/',
      action: () => navigate('/'),
    },
    {
      icon: Search,
      label: 'Cari',
      path: '/search',
      action: () => navigate('/search'),
    },
    {
      icon: Heart,
      label: 'Wishlist',
      path: '/wishlist',
      action: () => {
        if (user) {
          navigate('/wishlist');
        } else {
          onAuthClick?.();
        }
      },
      requiresAuth: true,
    },
    {
      icon: ShoppingCart,
      label: 'Keranjang',
      path: '/cart',
      action: () => {
        if (user) {
          onCartClick?.();
        } else {
          onAuthClick?.();
        }
      },
      requiresAuth: true,
      badge: user ? getTotalItems() : 0,
    },
    {
      icon: User,
      label: 'Akun',
      path: '/profile',
      action: () => {
        if (user) {
          navigate('/profile');
        } else {
          onAuthClick?.();
        }
      },
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={item.action}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative",
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active && "fill-current")} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center text-[10px] p-0 bg-destructive hover:bg-destructive"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
};

export default MobileBottomNav;
