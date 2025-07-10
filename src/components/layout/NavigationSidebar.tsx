
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  Store,
  Gift,
  Truck,
  CreditCard,
  TrendingUp,
  Globe,
  UserCheck,
  RotateCcw,
  Tag,
  Boxes
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const NavigationSidebar = () => {
  const { signOut, profile } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const mainMenuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pos', label: 'Point of Sale', icon: ShoppingCart },
    { path: '/products', label: 'Produk', icon: Package },
    { path: '/categories-units', label: 'Kategori & Unit', icon: Tag },
    { path: '/purchases', label: 'Pembelian', icon: Truck },
    { path: '/returns', label: 'Return Barang', icon: RotateCcw },
    { path: '/inventory', label: 'Inventori', icon: Boxes },
  ];

  const customerMenuItems = [
    { path: '/customers', label: 'Pelanggan', icon: Users },
    { path: '/orders', label: 'Pesanan Online', icon: ShoppingCart },
    { path: '/points-rewards', label: 'Poin & Reward', icon: Gift },
    { path: '/point-exchange', label: 'Tukar Poin', icon: Gift },
  ];

  const financeMenuItems = [
    { path: '/expenses', label: 'Pengeluaran', icon: DollarSign },
    { path: '/credit-management', label: 'Manajemen Kredit', icon: CreditCard },
    { path: '/reports', label: 'Laporan', icon: BarChart3 },
  ];

  const systemMenuItems = [
    { path: '/suppliers', label: 'Supplier', icon: Store },
    { path: '/flash-sales', label: 'Flash Sale', icon: TrendingUp },
    { path: '/frontend', label: 'Website Toko', icon: Globe },
    { path: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  const adminMenuItems = [
    { path: '/user-management', label: 'Manajemen User', icon: UserCheck },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  const MenuItem = ({ item, badge }: { item: any; badge?: string }) => (
    <NavLink 
      to={item.path} 
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
        isActive(item.path) ? 'bg-muted text-primary' : ''
      }`}
    >
      <item.icon className="h-4 w-4" />
      <span className="text-sm">{item.label}</span>
      {badge && <Badge variant="secondary" className="ml-auto">{badge}</Badge>}
    </NavLink>
  );

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-lg font-semibold">POS System</h2>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {/* Main Menu */}
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Menu Utama
            </h3>
            <div className="space-y-1">
              {mainMenuItems.map((item) => (
                <MenuItem key={item.path} item={item} />
              ))}
            </div>
          </div>

          <Separator />

          {/* Customer Menu */}
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pelanggan
            </h3>
            <div className="space-y-1">
              {customerMenuItems.map((item) => (
                <MenuItem key={item.path} item={item} />
              ))}
            </div>
          </div>

          <Separator />

          {/* Finance Menu */}
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Keuangan
            </h3>
            <div className="space-y-1">
              {financeMenuItems.map((item) => (
                <MenuItem key={item.path} item={item} />
              ))}
            </div>
          </div>

          <Separator />

          {/* System Menu */}
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sistem
            </h3>
            <div className="space-y-1">
              {systemMenuItems.map((item) => (
                <MenuItem key={item.path} item={item} />
              ))}
            </div>
          </div>

          {/* Admin Menu - Only show for admin users */}
          {profile?.role === 'admin' && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin
                </h3>
                <div className="space-y-1">
                  {adminMenuItems.map((item) => (
                    <MenuItem key={item.path} item={item} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <p className="font-medium">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'staff'}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 mt-2" 
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
};

export default NavigationSidebar;
