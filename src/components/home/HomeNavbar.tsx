
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
import { useSettings } from '@/hooks/useSettings';

interface HomeNavbarProps {
  onCartClick?: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearch?: () => void;
}

const BatikPattern = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 800 120" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="batikNav" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        {/* Kawung motif */}
        <ellipse cx="30" cy="30" rx="12" ry="18" fill="white" opacity="0.5" transform="rotate(0 30 30)" />
        <ellipse cx="30" cy="30" rx="12" ry="18" fill="white" opacity="0.5" transform="rotate(90 30 30)" />
        <circle cx="30" cy="30" r="5" fill="white" opacity="0.7" />
        <circle cx="0" cy="0" r="4" fill="white" opacity="0.3" />
        <circle cx="60" cy="0" r="4" fill="white" opacity="0.3" />
        <circle cx="0" cy="60" r="4" fill="white" opacity="0.3" />
        <circle cx="60" cy="60" r="4" fill="white" opacity="0.3" />
        {/* Parang-style diagonal */}
        <path d="M0 0 Q15 15 0 30" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
        <path d="M60 0 Q45 15 60 30" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
        <path d="M0 30 Q15 45 0 60" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
        <path d="M60 30 Q45 45 60 60" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
      </pattern>
    </defs>
    <rect width="800" height="120" fill="url(#batikNav)" />
  </svg>
);

const BatikTopBar = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 800 40" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="batikTop" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
        <circle cx="20" cy="20" r="3" fill="white" opacity="0.5" />
        <circle cx="0" cy="0" r="3" fill="white" opacity="0.3" />
        <circle cx="40" cy="0" r="3" fill="white" opacity="0.3" />
        <circle cx="0" cy="40" r="3" fill="white" opacity="0.3" />
        <circle cx="40" cy="40" r="3" fill="white" opacity="0.3" />
        <path d="M0 20 Q10 10 20 20 Q30 30 40 20" stroke="white" strokeWidth="0.8" fill="none" opacity="0.4" />
      </pattern>
    </defs>
    <rect width="800" height="40" fill="url(#batikTop)" />
  </svg>
);

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

  const { data: settings } = useSettings();

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
      <nav className="shadow-lg border-b border-emerald-700/30 sticky top-0 z-50 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 relative overflow-hidden">
        <BatikPattern />

        {/* Top bar with contact info - Hidden on mobile */}
        {!isMobile && (
          <div className="relative bg-gradient-to-r from-emerald-900 via-green-800 to-emerald-900 text-white/90 py-2 overflow-hidden">
            <BatikTopBar />
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm relative z-10">
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 relative z-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Store Name */}
            <div className="flex items-center space-x-3">
              {logoUrl && (
                <div className="relative">
                  <img 
                    src={logoUrl} 
                    alt={storeName} 
                    className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full object-cover ring-2 ring-white/50`} 
                  />
                </div>
              )}
              {!logoUrl && (
                <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30`}>
                  <Store className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                </div>
              )}
              <div>
                <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white drop-shadow-sm`}>
                  {isMobile ? storeName.slice(0, 15) + (storeName.length > 15 ? '...' : '') : storeName}
                </h1>
                {!isMobile && (
                  <p className="text-xs text-emerald-100/80">
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
                    className="text-white/90 hover:text-white font-medium transition-colors duration-200 relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-200 transition-all duration-300 group-hover:w-full"></span>
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
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative hover:bg-white/15 p-2 text-white"
                  onClick={onCartClick}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-amber-500 hover:bg-amber-600 border-0">
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
                        <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-white/15 px-3 py-2 rounded-xl text-white">
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
                      className="border-white/40 text-white hover:bg-white/15 hover:text-white px-4 bg-white/10 backdrop-blur-sm"
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
                  className="p-2 text-white hover:bg-white/15"
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
          <div className="bg-emerald-800/95 backdrop-blur-md border-t border-emerald-600/30 relative z-10">
            <div className="px-4 py-4 space-y-4">
              {contactInfo.phone && (
                <div className="text-sm text-emerald-100/70 pb-2 border-b border-emerald-600/30">
                  📞 {contactInfo.phone}
                </div>
              )}
              
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-white/90 hover:text-white font-medium py-2 text-base"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              
              <div className="border-t border-emerald-600/30 pt-4">
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
                        <UserCircle className="h-8 w-8 text-emerald-200" />
                      )}
                      <div>
                        <p className="font-medium text-white">
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-sm text-emerald-200/70">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="w-full justify-start border-emerald-500/40 text-white hover:bg-white/10 bg-transparent"
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
                    className="w-full justify-start border-emerald-400/40 text-white hover:bg-white/10 bg-white/10"
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

export default HomeNavbar;
