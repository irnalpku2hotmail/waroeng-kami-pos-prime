
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

  const hasPermission = (permission: string) => {
    if (!permissions) return false;
    return permissions.some(p => p.permission === permission && p.allowed);
  };

  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      permission: 'view_dashboard'
    },
    {
      path: '/products',
      icon: Package,
      label: 'Produk',
      permission: 'view_products'
    },
    {
      path: '/categories',
      icon: Archive,
      label: 'Kategori & Unit',
      permission: 'view_categories'
    },
    {
      path: '/suppliers',
      icon: Truck,
      label: 'Supplier',
      permission: 'view_suppliers'
    },
    {
      path: '/customers',
      icon: Users,
      label: 'Pelanggan',
      permission: 'view_customers'
    },
    {
      path: '/purchases',
      icon: ShoppingCart,
      label: 'Pembelian',
      permission: 'view_purchases'
    },
    {
      path: '/returns',
      icon: RotateCcw,
      label: 'Return',
      permission: 'view_returns'
    },
    {
      path: '/pos',
      icon: Calculator,
      label: 'Point of Sale',
      permission: 'view_pos'
    },
    {
      path: '/orders',
      icon: ClipboardList,
      label: 'Pesanan',
      permission: 'view_orders'
    },
    {
      path: '/flash-sales',
      icon: Zap,
      label: 'Flash Sale',
      permission: 'view_flash_sales'
    },
    {
      path: '/points-rewards',
      icon: Gift,
      label: 'Point & Reward',
      permission: 'view_points_rewards'
    },
    {
      path: '/point-exchange',
      icon: Coins,
      label: 'Tukar Point',
      permission: 'view_point_exchange'
    },
    {
      path: '/credit-management',
      icon: CreditCard,
      label: 'Manajemen Kredit',
      permission: 'view_credit_management'
    },
    {
      path: '/user-management',
      icon: UserCheck,
      label: 'Manajemen User',
      permission: 'view_user_management'
    },
    {
      path: '/user-locations',
      icon: MapPin,
      label: 'Lokasi User',
      permission: 'view_user_locations'
    },
    {
      path: '/inventory',
      icon: Archive,
      label: 'Inventori',
      permission: 'view_inventory'
    },
    {
      path: '/expenses',
      icon: DollarSign,
      label: 'Pengeluaran',
      permission: 'view_expenses'
    },
    {
      path: '/reports',
      icon: BarChart3,
      label: 'Laporan',
      permission: 'view_reports'
    },
    {
      path: '/notifications',
      icon: Bell,
      label: 'Notifikasi',
      permission: 'view_notifications'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Pengaturan',
      permission: 'view_settings'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profil',
      permission: 'view_profile'
    }
  ];

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission));

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
