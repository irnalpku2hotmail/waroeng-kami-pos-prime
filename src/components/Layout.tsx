
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Receipt,
  Gift,
  Zap,
  Settings,
  UserCheck,
  LogOut,
  Menu,
  X,
  Store,
  Tag,
  Ruler,
  Warehouse
} from 'lucide-react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShoppingCart, label: 'POS', path: '/pos' },
    { icon: Package, label: 'Produk', path: '/products' },
    { icon: Tag, label: 'Kategori', path: '/categories' },
    { icon: Ruler, label: 'Unit', path: '/units' },
    { icon: Warehouse, label: 'Inventory', path: '/inventory' },
    { icon: Users, label: 'Customer', path: '/customers' },
    { icon: CreditCard, label: 'Kredit', path: '/credit' },
    { icon: Receipt, label: 'Pengeluaran', path: '/expenses' },
    { icon: Gift, label: 'Points & Rewards', path: '/rewards' },
    { icon: Zap, label: 'Flash Sales', path: '/flash-sales' },
    { icon: Settings, label: 'Pengaturan', path: '/settings' },
    { icon: UserCheck, label: 'User Management', path: '/users' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast({ title: 'Logout berhasil' });
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal logout', variant: 'destructive' });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-blue-800 text-white transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-700">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8" />
              <span className="text-xl font-bold">WaroengKami</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-blue-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-blue-700 p-4">
            <div className="flex items-center justify-between">
              <Link
                to="/profile"
                className="flex items-center gap-3 text-blue-100 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Profile</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-blue-100 hover:text-white hover:bg-blue-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-blue-800">WaroengKami</span>
            </div>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
