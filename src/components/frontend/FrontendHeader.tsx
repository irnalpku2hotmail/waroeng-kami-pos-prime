
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Search, User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import AuthModal from '@/components/AuthModal';
import CartModal from '@/components/CartModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FrontendHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const FrontendHeader = ({ searchTerm, setSearchTerm }: FrontendHeaderProps) => {
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['store_name', 'store_phone', 'store_address', 'store_email']);
      
      if (error) throw error;
      
      const settings: Record<string, any> = {};
      data?.forEach((setting) => {
        settings[setting.key] = setting.value;
      });
      
      return settings;
    }
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const storeName = storeSettings?.store_name?.name || 'Waroeng Kami';

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-blue-600">{storeName}</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCartModalOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>

              {/* Auth */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login / Register</DialogTitle>
          </DialogHeader>
          <AuthModal onClose={() => setAuthModalOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Cart Modal */}
      <CartModal open={cartModalOpen} onClose={() => setCartModalOpen(false)} />
    </>
  );
};

export default FrontendHeader;
