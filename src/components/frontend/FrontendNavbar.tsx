
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, LogOut, LogIn, UserCircle, Menu, X, Store, Search, Settings, Heart, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import AuthModal from '@/components/AuthModal';
import { useSettings } from '@/hooks/useSettings';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface FrontendNavbarProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onCartClick?: () => void;
  searchComponent?: React.ReactNode;
  showSearch?: boolean;
}

const FrontendNavbar = ({ 
  searchTerm = '',
  onSearchChange,
  onCartClick,
  searchComponent,
  showSearch = true
}: FrontendNavbarProps) => {
  const { user, signOut } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();

  // Track scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch store settings
  const { data: settings } = useSettings();

  // Fetch categories for brand dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
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
  const storeName = settings?.store_name?.name || 'LAPAU.ID';
  const tagline = storeInfo.tagline || 'Toko Online Terpercaya';

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const handleSearch = () => {
    if (onSearchChange) {
      onSearchChange(localSearchTerm);
    } else if (localSearchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(localSearchTerm)}`);
    }
  };

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    }
  };

  return (
    <>
      <nav
        className={`navbar-batik fixed top-0 z-50 w-full transition-shadow duration-300 ${scrolled ? 'navbar-batik-scrolled' : 'navbar-batik-idle'}`}
      >
        {/* Top bar with contact info - Hidden on mobile */}
        {!isMobile && (
          <div className="bg-[#028A0B] text-white py-1.5">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-4">
                {contactInfo.phone && (
                  <span>📞 {contactInfo.phone}</span>
                )}
                {contactInfo.email && (
                  <span className="hidden md:inline">✉️ {contactInfo.email}</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span>Selamat Datang di {storeName}!</span>
              </div>
            </div>
          </div>
        )}

        {/* Main navbar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className={`flex items-center justify-between ${isMobile ? 'h-12' : 'h-16'}`}>
            {/* Logo & Store Name with Category Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div 
                  className="flex items-center space-x-2 cursor-pointer flex-shrink-0" 
                >
                  {!isMobile && (
                    logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt={storeName} 
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-white/40" 
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Store className="h-5 w-5 text-white" />
                      </div>
                    )
                  )}
                  {!isMobile && (
                    <div>
                      <h1 className="text-xl font-extrabold text-white whitespace-nowrap">
                        {storeName}
                      </h1>
                      <p className="text-xs text-white/70 truncate max-w-[180px]">
                        {tagline}
                      </p>
                    </div>
                  )}
                  {isMobile && (
                    <h1 className="text-sm font-extrabold text-white whitespace-nowrap">
                      {storeName.length > 8 ? storeName.split(' ')[0] || storeName.substring(0, 7) : storeName}
                    </h1>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={() => navigate('/')}>
                  🏠 Beranda
                </DropdownMenuItem>
                {categories.map((category: any) => (
                  <DropdownMenuItem 
                    key={category.id} 
                    onClick={() => navigate(`/search?category=${category.id}`)}
                  >
                    📦 {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search Bar - Inline for both mobile and desktop */}
            {showSearch && (
              <div className={`flex-1 ${isMobile ? 'mx-2' : 'max-w-2xl mx-8'}`}>
                {searchComponent || (
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Cari produk..."
                      value={localSearchTerm}
                      onChange={(e) => setLocalSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className={`flex-1 bg-white border-0 rounded-lg ${isMobile ? 'h-8 text-xs' : 'h-10'}`}
                    />
                    <Button onClick={handleSearch} className={`bg-[#028A0B] hover:bg-[#026d09] rounded-lg ${isMobile ? 'h-8 w-8 p-0' : 'h-10'}`}>
                      <Search className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-white`} />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Notification */}
              {user && <NotificationDropdown />}

              {/* Cart - Desktop only (mobile has bottom nav) */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 text-white hover:bg-white/10"
                  onClick={handleCartClick}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] bg-red-500 hover:bg-red-600 border-0">
                      {getTotalItems()}
                    </Badge>
                  )}
                </Button>
              )}

              {/* User Menu - Desktop */}
              {!isMobile && (
                <div>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded-xl">
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt="Profile" 
                              className="h-6 w-6 rounded-full object-cover ring-1 ring-white/40"
                            />
                          ) : (
                            <UserCircle className="h-6 w-6" />
                          )}
                          <span className="hidden lg:inline text-sm font-medium">
                            {profile?.full_name || user.email?.split('@')[0]}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                          <Settings className="h-4 w-4 mr-2" />
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                          <Heart className="h-4 w-4 mr-2" />
                          Wishlist
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setAuthModalOpen(true)}
                      className="text-white hover:bg-white/10 border border-white/30 px-4"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Masuk
                    </Button>
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-white hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isMobile && (
          <div className="bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-4">
              {contactInfo.phone && (
                <div className="text-sm text-muted-foreground pb-2 border-b border-border">
                  📞 {contactInfo.phone}
                </div>
              )}
              
              <div className="border-t border-border pt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 py-2">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt="Profile" 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                      className="w-full justify-start mb-2"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { navigate('/wishlist'); setMobileMenuOpen(false); }}
                      className="w-full justify-start mb-2"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Wishlist
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
                    onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                    className="w-full justify-start border-[#03AC0E] text-[#03AC0E] hover:bg-[#03AC0E]/10"
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

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};

export default FrontendNavbar;
