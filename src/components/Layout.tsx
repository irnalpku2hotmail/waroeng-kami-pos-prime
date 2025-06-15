import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button';
import { ModeToggle } from './ModeToggle';
import {
  Globe,
  CreditCard,
  LayoutGrid,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  TrendingDown,
  Truck,
  Undo2,
  Users,
  Warehouse,
  Gift,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import CartModal from './CartModal';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  {
    title: 'Main',
    subItems: [
      { icon: LayoutGrid, label: 'Dashboard', href: '/' },
      { icon: Users, label: 'Customers', href: '/customers' },
      { icon: Package, label: 'Products', href: '/products' },
      { icon: Tags, label: 'Categories & Units', href: '/categories-units' },
      { icon: Truck, label: 'Suppliers', href: '/suppliers' },
      { icon: Warehouse, label: 'Inventory', href: '/inventory' },
      { icon: ShoppingCart, label: 'Purchases', href: '/purchases' },
      { icon: Undo2, label: 'Returns', href: '/returns' },
    ],
  },
  {
    title: 'Sales & Marketing',
    subItems: [
      { icon: Receipt, label: 'Orders', href: '/orders' },
      { icon: CreditCard, label: 'Credit Management', href: '/credit-management' },
      { icon: TrendingDown, label: 'Expenses', href: '/expenses' },
      { icon: Gift, label: 'Rewards', href: '/rewards' },
      { icon: Zap, label: 'Flash Sales', href: '/flash-sales' },
    ],
  },
  {
    title: 'System',
    subItems: [
      { icon: Settings, label: 'Settings', href: '/settings' },
      { icon: ShieldCheck, label: 'User Management', href: '/user-management' },
      { icon: Globe, label: 'Website', href: '/website' },
    ],
  },
];

const mobileNavItems = [
  { icon: LayoutGrid, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'Customers', href: '/customers' },
  { icon: Package, label: 'Products', href: '/products' },
  { icon: Tags, label: 'Categories & Units', href: '/categories-units' },
  { icon: Truck, label: 'Suppliers', href: '/suppliers' },
  { icon: Warehouse, label: 'Inventory', href: '/inventory' },
  { icon: ShoppingCart, label: 'Purchases', href: '/purchases' },
  { icon: Undo2, label: 'Returns', href: '/returns' },
  { icon: Receipt, label: 'Orders', href: '/orders' },
  { icon: CreditCard, label: 'Credit Management', href: '/credit-management' },
  { icon: TrendingDown, label: 'Expenses', href: '/expenses' },
  { icon: Gift, label: 'Rewards', href: '/rewards' },
  { icon: Zap, label: 'Flash Sales', href: '/flash-sales' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: ShieldCheck, label: 'User Management', href: '/user-management' },
  { icon: Globe, label: 'Website', href: '/website' },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const { toast } = useToast();
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden absolute top-4 left-4">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="pl-6 pr-4 pt-4 pb-2">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </SheetDescription>
          </SheetHeader>
          <div className="py-2">
            {mobileNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800",
                  pathname === item.href ? "bg-gray-100 dark:bg-gray-800" : ""
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sidebar (hidden on small screens) */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between py-4 px-4">
          <Link to="/" className="font-bold text-lg">SmartPOS</Link>
          <ModeToggle />
        </div>
        <nav className="flex-1">
          {navItems.map((navGroup, index) => (
            <div key={index} className="space-y-1">
              {navGroup.title && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{navGroup.title}</div>
              )}
              {navGroup.subItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700",
                    pathname === item.href ? "bg-gray-200 dark:bg-gray-700" : ""
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">
            {navItems.flatMap(group => group.subItems).find(item => item.href === pathname)?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setIsCartModalOpen(true)}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart ({items.length})
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                  <Avatar>
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link to="/settings" className="w-full h-full block">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  signOut();
                  toast({
                    title: "Signed out",
                    description: "You have been signed out successfully.",
                  })
                }}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {children}
      </main>

      <CartModal open={isCartModalOpen} onOpenChange={setIsCartModalOpen} />
    </div>
  );
};

export default Layout;
