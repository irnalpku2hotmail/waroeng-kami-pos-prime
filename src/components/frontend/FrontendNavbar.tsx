
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Heart, User, LogOut, LogIn } from 'lucide-react';
import CartModal from '@/components/CartModal';
import AuthModal from '@/components/AuthModal';

interface FrontendNavbarProps {
  storeName: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  likedProducts: string[];
  onToggleLike: (productId: string) => void;
}

const FrontendNavbar = ({ 
  storeName, 
  searchTerm, 
  onSearchChange, 
  likedProducts, 
  onToggleLike 
}: FrontendNavbarProps) => {
  const { user, signOut } = useAuth();
  const { getTotalItems } = useCart();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Fetch store logo
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  const storeInfo = settings?.store_info || {};
  const logoUrl = storeInfo.logo_url;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Store Name */}
            <div className="flex items-center space-x-3">
              {logoUrl && (
                <img src={logoUrl} alt={storeName} className="h-8 w-8 rounded" />
              )}
              <h1 className="text-xl font-bold text-blue-600">{storeName}</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Wishlist */}
              <Button variant="ghost" size="sm" className="relative">
                <Heart className="h-5 w-5" />
                {likedProducts.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs">
                    {likedProducts.length}
                  </Badge>
                )}
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setCartModalOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-blue-600">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <User className="h-5 w-5 mr-2" />
                    {user.email?.split('@')[0]}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setAuthModalOpen(true)}>
                  <LogIn className="h-5 w-5 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};

export default FrontendNavbar;
