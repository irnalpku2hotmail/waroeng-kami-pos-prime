
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  RotateCcw, 
  Calculator, 
  BarChart3, 
  Settings, 
  DollarSign, 
  User, 
  ClipboardList, 
  Zap, 
  Gift, 
  Coins, 
  CreditCard, 
  UserCheck, 
  MapPin, 
  Archive,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationSidebarProps {
  onLinkClick?: () => void;
}

const NavigationSidebar = ({ onLinkClick }: NavigationSidebarProps) => {
  const { profile } = useAuth();
  const location = useLocation();

  // Fetch role permissions
  const { data: permissions } = useQuery({
    queryKey: ['role-permissions', profile?.role],
    queryFn: async () => {
      if (!profile?.role) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', profile.role as 'admin' | 'cashier' | 'manager' | 'staff' | 'buyer');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.role
  });

  const hasPermission = (resource: string) => {
    if (!permissions) return false;
    return permissions.some(p => p.resource === resource && p.can_read);
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      resource: 'dashboard'
    },
    {
      path: '/products',
      icon: Package,
      label: 'Produk',
      resource: 'products'
    },
    {
      path: '/categories',
      icon: Archive,
      label: 'Kategori & Unit',
      resource: 'categories'
    },
    {
      path: '/suppliers',
      icon: Truck,
      label: 'Supplier',
      resource: 'suppliers'
    },
    {
      path: '/customers',
      icon: Users,
      label: 'Pelanggan',
      resource: 'customers'
    },
    {
      path: '/purchases',
      icon: ShoppingCart,
      label: 'Pembelian',
      resource: 'purchases'
    },
    {
      path: '/returns',
      icon: RotateCcw,
      label: 'Return',
      resource: 'returns'
    },
    {
      path: '/pos',
      icon: Calculator,
      label: 'Point of Sale',
      resource: 'pos'
    },
    {
      path: '/orders',
      icon: ClipboardList,
      label: 'Pesanan',
      resource: 'orders'
    },
    {
      path: '/flash-sales',
      icon: Zap,
      label: 'Flash Sale',
      resource: 'flash_sales'
    },
    {
      path: '/points-rewards',
      icon: Gift,
      label: 'Point & Reward',
      resource: 'points_rewards'
    },
    {
      path: '/point-exchange',
      icon: Coins,
      label: 'Tukar Point',
      resource: 'point_exchange'
    },
    {
      path: '/credit-management',
      icon: CreditCard,
      label: 'Manajemen Kredit',
      resource: 'credit_management'
    },
    {
      path: '/user-management',
      icon: UserCheck,
      label: 'Manajemen User',
      resource: 'user_management'
    },
    {
      path: '/user-locations',
      icon: MapPin,
      label: 'Lokasi User',
      resource: 'user_locations'
    },
    {
      path: '/inventory',
      icon: Archive,
      label: 'Inventori',
      resource: 'inventory'
    },
    {
      path: '/expenses',
      icon: DollarSign,
      label: 'Pengeluaran',
      resource: 'expenses'
    },
    {
      path: '/reports',
      icon: BarChart3,
      label: 'Laporan',
      resource: 'reports'
    },
    {
      path: '/notifications',
      icon: Bell,
      label: 'Notifikasi',
      resource: 'notifications'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Pengaturan',
      resource: 'settings'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profil',
      resource: 'profile'
    }
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => hasPermission(item.resource));

  return (
    <nav className="space-y-2">
      {visibleMenuItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              isActive
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationSidebar;
