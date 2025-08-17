
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Settings,
  FileText,
  TrendingUp,
  Package2,
  ChevronLeft,
  ChevronRight,
  Truck,
  Gift,
  UserPlus,
  FolderOpen,
  Calculator,
  Receipt,
  ArrowLeftRight,
  Zap,
  Bell,
  Shield
} from 'lucide-react';

const CollapsibleSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();
  const { hasPermission } = usePermissions();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      permission: null
    },
    {
      title: 'POS',
      icon: Calculator,
      path: '/pos',
      permission: 'pos'
    },
    {
      title: 'Produk',
      icon: Package,
      path: '/products',
      permission: 'products'
    },
    {
      title: 'Kategori & Unit',
      icon: FolderOpen,
      path: '/categories-units',
      permission: 'categories'
    },
    {
      title: 'Pesanan',
      icon: ShoppingCart,
      path: '/orders',
      permission: 'orders'
    },
    {
      title: 'Inventory',
      icon: Package2,
      path: '/inventory',
      permission: 'inventory'
    },
    {
      title: 'Pembelian',
      icon: Truck,
      path: '/purchases',
      permission: 'purchases'
    },
    {
      title: 'Return',
      icon: ArrowLeftRight,
      path: '/returns',
      permission: 'returns'
    },
    {
      title: 'Supplier',
      icon: Users,
      path: '/suppliers',
      permission: 'suppliers'
    },
    {
      title: 'Customer',
      icon: UserPlus,
      path: '/customers',
      permission: 'customers'
    },
    {
      title: 'Kredit',
      icon: CreditCard,
      path: '/credit-management',
      permission: 'credit'
    },
    {
      title: 'Flash Sale',
      icon: Zap,
      path: '/flash-sales',
      permission: 'flash_sales'
    },
    {
      title: 'Rewards',
      icon: Gift,
      path: '/points-rewards',
      permission: 'rewards'
    },
    {
      title: 'Laporan',
      icon: FileText,
      path: '/reports',
      permission: 'reports'
    },
    {
      title: 'Pengeluaran',
      icon: Receipt,
      path: '/expenses',
      permission: 'expenses'
    },
    {
      title: 'Notifikasi',
      icon: Bell,
      path: '/notifications',
      permission: 'notifications'
    },
    {
      title: 'User Management',
      icon: Shield,
      path: '/user-management',
      permission: 'user_management',
      adminOnly: true
    },
    {
      title: 'Pengaturan',
      icon: Settings,
      path: '/settings',
      permission: 'settings'
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && profile?.role !== 'admin') {
      return false;
    }
    if (item.permission && !hasPermission(item.permission, 'read')) {
      return false;
    }
    return true;
  });

  return (
    <div className={`bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-40 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-blue-800">Admin Panel</h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default CollapsibleSidebar;
