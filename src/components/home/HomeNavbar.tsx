
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, ShoppingCart, User, LogOut, LogIn, UserCircle, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import CartModal from '@/components/CartModal';
import AuthModal from '@/components/AuthModal';

interface HomeNavbarProps {
  storeName: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const HomeNavbar = ({ 
  storeName, 
  searchTerm, 
  onSearchChange
}: HomeNavbarProps) => {
  const { user, signOut } = useAuth();
  const { getTotalItems } = useCart();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch store settings
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

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  const storeInfo = settings?.store_info || {};
  const contactInfo = settings?.contact_info || {};
  const logoUrl = storeInfo.logo_url;

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
        {/* Top bar with contact info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              {contactInfo.phone && (
                <span>📞 {contactInfo.phone}</span>
              )}
              {contactInfo.email && (
                <span className="hidden md:inline">✉️ {contactInfo.email}</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span>Selamat Datang di TokoQu!</span>
              {user && (
                <Link to="/dashboard" className="text-yellow-300 hover:text-yellow-100">
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main navbar */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Store Name */}
            <Link to="/" className="flex items-center space-x-3">
              {logoUrl && (
                <div className="relative">
                  <img 
                    src={logoUrl} 
                    alt="TokoQu" 
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500" 
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TokoQu
                </h1>
                <p className="text-xs text-gray-500 hidden md:block">
                  {storeInfo.tagline || 'Toko Online Terpercaya'}
                </p>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Cari produk favorit Anda..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-12 pr-4 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-full text-lg"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart - Only show if user is logged in */}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative hover:bg-blue-50 p-3"
                  onClick={() => setCartModalOpen(true)}
                >
                  <ShoppingCart className="h-6 w-6" />
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600 rounded-full">
                      {getTotalItems()}
                    </Badge>
                  )}
                </Button>
              )}

              {/* User Menu - Desktop */}
              <div className="hidden md:block">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-blue-50 p-3">
                        {profile?.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt="Profile" 
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-8 w-8" />
                        )}
                        <span className="hidden lg:inline font-medium">
                          {profile?.full_name || user.email?.split('@')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem disabled>
                        <User className="h-4 w-4 mr-2" />
                        {profile?.full_name || user.email?.split('@')[0]}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/profile">
                          <UserCircle className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setAuthModalOpen(true)}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-2"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Masuk
                  </Button>
                )}
              </div>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 w-full"
              />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-4">
              <div className="border-t pt-4">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 py-2">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-6 w-6" />
                      )}
                      <span className="text-gray-700">
                        {profile?.full_name || user.email?.split('@')[0]}
                      </span>
                    </div>
                    <Link to="/profile">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start mb-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserCircle className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Masuk
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Modals */}
      {user && <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};

export default HomeNavbar;
