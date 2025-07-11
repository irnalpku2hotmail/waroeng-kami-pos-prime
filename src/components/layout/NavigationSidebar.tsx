
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Building2,
  CreditCard,
  BarChart3,
  Truck,
  RotateCcw,
  Calculator,
  DollarSign,
  Gift,
  Star,
  UserCog,
  Layers,
  Globe,
  Bell,
  MapPin
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Produk',
    icon: Package,
    children: [
      { title: 'Daftar Produk', href: '/products' },
      { title: 'Kategori & Unit', href: '/categories' },
      { title: 'Inventori', href: '/inventory' }
    ]
  },
  {
    title: 'Penjualan',
    icon: ShoppingCart,
    children: [
      { title: 'Point of Sale', href: '/pos' },
      { title: 'Orders', href: '/orders' },
      { title: 'Flash Sales', href: '/flash-sales' }
    ]
  },
  {
    title: 'Pembelian',
    icon: Truck,
    children: [
      { title: 'Daftar Pembelian', href: '/purchases' },
      { title: 'Return Barang', href: '/returns' },
      { title: 'Supplier', href: '/suppliers' }
    ]
  },
  {
    title: 'Pelanggan',
    icon: Users,
    children: [
      { title: 'Daftar Pelanggan', href: '/customers' },
      { title: 'Poin & Reward', href: '/points-rewards' },
      { title: 'Tukar Poin', href: '/point-exchange' }
    ]
  },
  {
    title: 'Keuangan',
    icon: DollarSign,
    children: [
      { title: 'Laporan', href: '/reports' },
      { title: 'Pengeluaran', href: '/expenses' },
      { title: 'Kredit', href: '/credit-management' }
    ]
  },
  {
    title: 'Website',
    icon: Globe,
    children: [
      { title: 'Frontend', href: '/frontend' }
    ]
  },
  {
    title: 'Sistem',
    icon: Settings,
    children: [
      { title: 'Pengaturan', href: '/settings' },
      { title: 'User Management', href: '/user-management' },
      { title: 'Notifikasi', href: '/notifications' },
      { title: 'Lokasi User', href: '/user-locations' }
    ]
  }
];

export default function NavigationSidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isParentActive = (children: any[]) => 
    children.some(child => location.pathname === child.href);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TQ</span>
          </div>
          <span className="text-xl font-bold text-gray-800">TokoQu</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isExpanded = expandedItems.includes(item.title);
            const hasChildren = item.children && item.children.length > 0;
            const parentActive = hasChildren && isParentActive(item.children);

            if (!hasChildren) {
              return (
                <Link
                  key={item.title}
                  to={item.href!}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive(item.href!)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              );
            }

            return (
              <Collapsible key={item.title} open={isExpanded} onOpenChange={() => toggleExpanded(item.title)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      parentActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.title}
                    {isExpanded ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      to={child.href}
                      className={cn(
                        "block px-10 py-2 text-sm rounded-md transition-colors",
                        isActive(child.href)
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      {child.title}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
