
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ShoppingCart, User, LogOut, LogIn, UserCircle, Menu, X, Store, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import AuthModal from '@/components/AuthModal';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import EnhancedHomeSearch from '@/components/home/EnhancedHomeSearch';
import ProductGridSmall from '@/components/home/ProductGridSmall';
import CompactBannerCarousel from '@/components/home/CompactBannerCarousel';
import EnhancedShippingInfo from '@/components/home/EnhancedShippingInfo';
import CompactFlashSale from '@/components/home/CompactFlashSale';
import CategoriesCarousel from '@/components/home/CategoriesCarousel';
import FrontendFooter from '@/components/frontend/FrontendFooter';
import { Separator } from '@/components/ui/separator';


const Home = () => {
  const { user, signOut } = useAuth();
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
  const storeName = 'TokoQu';

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Navbar */}
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

            {/* Search Bar - Desktop */}
            {!isMobile && (
              <div className="flex-1 max-w-2xl mx-8">
                <EnhancedHomeSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Cart - Only show if user is logged in */}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative hover:bg-blue-50 p-2"
                  onClick={() => setShowCartModal(true)}
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
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                          <Settings className="h-4 w-4 mr-2" />
                          Profile
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
              <EnhancedHomeSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
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
                      onClick={() => {
                        navigate('/profile');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start mb-2"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Banner Carousel */}
        <CompactBannerCarousel />

        {/* Shipping Info */}
        <EnhancedShippingInfo />

        {/* Flash Sale */}
        <CompactFlashSale />

        {/* Products Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Produk Unggulan</h2>
          <ProductGridSmall 
            searchTerm={searchTerm} 
            selectedCategory={selectedCategory}
            limit={24}
          />
        </div>

        {/* Categories Carousel */}
        <CategoriesCarousel />
      </div>

      {/* Footer */}
      <FrontendFooter />

      {/* Modals */}
      {user && (
        <EnhancedFrontendCartModal 
          open={showCartModal} 
          onOpenChange={setShowCartModal} 
        />
      )}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};

export default Home;
