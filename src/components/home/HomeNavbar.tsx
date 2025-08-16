
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, LogOut, LogIn, UserCircle, Menu, X, Store } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import AuthModal from '@/components/AuthModal';
import EnhancedSearch from './EnhancedSearch';

interface HomeNavbarProps {
  onCartClick?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch?: () => void;
}

const HomeNavbar = ({ 
  onCartClick,
  searchTerm, 
  onSearchChange,
  onSearch
}: HomeNavbarProps) => {
  const { user, signOut } = useAuth();
  const { getTotalItems } = useCart();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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
  const storeName = storeInfo.name || 'Toko Online';

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Beranda', href: '#home' },
    { label: 'Produk', href: '#products' },
    { label: 'Kategori', href: '#categories' },
    { label: 'Flash Sale', href: '#flash-sale' },
    { label: 'Tentang', href: '#about' }
  ];

  return (
    <>
      <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
        {/* Top bar with contact info - Hidden on mobile */}
        {!isMobile && (
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
                <span>Selamat Datang di {storeName}!</span>
              </div>
            </div>
          </div>
        )}

        {/* Main navbar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Store Name */}
            <div className="flex items-center space-x-3">
              {logoUrl && (
                <div className="relative">
                  <img 
                    src={logoUrl} 
                    alt={storeName} 
                    className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full object-cover ring-2 ring-blue-500`} 
                  />
                </div>
              )}
              {!logoUrl && (
                <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-blue-600 flex items-center justify-center`}>
                  <Store className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                </div>
              )}
              <div>
                <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                  {isMobile ? storeName.slice(0, 15) + (storeName.length > 15 ? '...' : '') : storeName}
                </h1>
                {!isMobile && (
                  <p className="text-xs text-gray-500">
                    {storeInfo.tagline || 'Toko Online Terpercaya'}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="hidden lg:flex items-center space-x-8">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                  </a>
                ))}
              </div>
            )}

            {/* Enhanced Search Bar */}
            {!isMobile && (
              <EnhancedSearch
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                onSearch={onSearch}
              />
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Cart - Only show if user is logged in */}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative hover:bg-blue-50 p-2"
                  onClick={onCartClick}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
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
                        <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-blue-50 px-3 py-2 rounded-xl">
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt="Profile" 
                              className="h-6 w-6 rounded-full object-cover"
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
                        <DropdownMenuItem disabled>
                          <User className="h-4 w-4 mr-2" />
                          {profile?.full_name || user.email?.split('@')[0]}
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
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 px-4"
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
                  className="p-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          {isMobile && (
            <div className="pb-4">
              <EnhancedSearch
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
                onSearch={onSearch}
              />
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isMobile && (
          <div className="bg-white border-t shadow-lg">
            <div className="px-4 py-4 space-y-4">
              {/* Contact info on mobile */}
              {contactInfo.phone && (
                <div className="text-sm text-gray-600 pb-2 border-b">
                  📞 {contactInfo.phone}
                </div>
              )}
              
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-gray-700 hover:text-blue-600 font-medium py-2 text-base"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              
              <div className="border-t pt-4">
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
                        <UserCircle className="h-8 w-8 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
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
