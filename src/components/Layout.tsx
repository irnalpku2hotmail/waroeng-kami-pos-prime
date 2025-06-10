
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Store, Menu, Home, Package, Layers3, Ruler, ShoppingCart, 
  Warehouse, Users, CreditCard, Receipt, Gift, Settings, User, LogOut 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'POS', path: '/pos', icon: ShoppingCart },
    { name: 'Produk', path: '/products', icon: Package },
    { name: 'Kategori', path: '/categories', icon: Layers3 },
    { name: 'Unit', path: '/units', icon: Ruler },
    { name: 'Inventori', path: '/inventory', icon: Warehouse },
    { name: 'Customer', path: '/customers', icon: Users },
    { name: 'Piutang', path: '/credit', icon: CreditCard },
    { name: 'Pengeluaran', path: '/expenses', icon: Receipt },
    { name: 'Reward', path: '/rewards', icon: Gift },
    { name: 'User', path: '/users', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-blue-800">WaroengKami</h2>
                  </div>
                </div>
                <nav className="flex-1 p-4">
                  <ul className="space-y-2">
                    {menuItems.map((item) => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                            location.pathname === item.path
                              ? 'bg-blue-100 text-blue-800'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Store className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-blue-800 hidden sm:block">WaroengKami</h1>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-sm text-gray-600">
            {profile?.full_name} ({profile?.role})
          </span>
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-r h-[calc(100vh-4rem)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
