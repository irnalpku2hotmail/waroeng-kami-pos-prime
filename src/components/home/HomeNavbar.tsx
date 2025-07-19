
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, LogOut, LogIn, UserCircle, Menu, X, History, Search } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

interface HomeNavbarProps {
  storeInfo?: {
    name?: string;
    address?: string;
    phone?: string;  
    email?: string;
  } | null;
  onCartClick?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const HomeNavbar = ({ storeInfo, onCartClick, searchTerm = '', onSearchChange }: HomeNavbarProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { getTotalItems } = useCart();
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

  const extractNameValue = (value: any): string => {
    if (!value) return 'Waroeng Kami';
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'object' && value !== null && 'name' in value) {
      const nameValue = (value as any).name;
      if (typeof nameValue === 'string') {
        return nameValue;
      }
    }
    
    return 'Waroeng Kami';
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
        {/* Top bar with contact info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              {storeInfo?.phone && (
                <span>📞 {storeInfo.phone}</span>
              )}
              {storeInfo?.email && (
                <span className="hidden md:inline">✉️ {storeInfo.email}</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span>Selamat Datang di {extractNameValue(storeInfo?.name)}!</span>
            </div>
          </div>
        </div>

        {/* Main navbar */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Store Name */}
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {extractNameValue(storeInfo?.name)}
                </h1>
                <p className="text-xs text-gray-500 hidden md:block">
                  Toko Online Terpercaya
                </p>
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="flex-1 max-w-lg mx-8 hidden md:block">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="pl-10 rounded-full border-2 border-gray-200 focus:border-blue-500"
                  />
                </div>
                <Button type="submit" className="rounded-full px-6">
                  Cari
                </Button>
              </form>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Button
                variant="ghost"
                size="sm"
                className="relative hover:bg-blue-50"
                onClick={onCartClick}
              >
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
                    {getTotalItems()}
                  </Badge>
                )}
              </Button>

              {/* User Menu - Desktop */}
              <div className="hidden md:block">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-blue-50">
                        {profile?.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt="Profile" 
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-6 w-6" />
                        )}
                        <span className="hidden lg:inline">
                          {profile?.full_name || user.email?.split('@')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem disabled>
                        <User className="h-4 w-4 mr-2" />
                        {profile?.full_name || user.email?.split('@')[0]}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/order-history')}>
                        <History className="h-4 w-4 mr-2" />
                        Riwayat Pesanan
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
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
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
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="px-6">
                Cari
              </Button>
            </form>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate('/profile');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigate('/order-history');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <History className="h-4 w-4 mr-2" />
                      Riwayat Pesanan
                    </Button>
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
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};

export default HomeNavbar;
