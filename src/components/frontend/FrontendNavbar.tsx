
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Search, Heart, User, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import FrontendCartModal from './FrontendCartModal';

interface FrontendNavbarProps {
  storeName: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
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
  const { items } = useCart();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Main Navbar */}
      <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">{storeName}</h1>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-2 border-gray-200 rounded-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Wishlist */}
              <Button variant="ghost" size="sm" className="relative">
                <Heart className="h-5 w-5" />
                {likedProducts.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500">
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
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-500">
                    {totalItems}
                  </Badge>
                )}
              </Button>

              {/* Auth */}
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Hi, {user.email}</span>
                </div>
              ) : (
                <Button 
                  onClick={() => setAuthModalOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border-2 border-gray-200 rounded-full focus:border-blue-500"
              />
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
              <div className="flex justify-around items-center">
                <Button variant="ghost" size="sm" className="relative flex flex-col items-center">
                  <Heart className="h-5 w-5" />
                  <span className="text-xs mt-1">Wishlist</span>
                  {likedProducts.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-red-500 text-xs">
                      {likedProducts.length}
                    </Badge>
                  )}
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative flex flex-col items-center"
                  onClick={() => setCartModalOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs mt-1">Cart</span>
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-blue-500 text-xs">
                      {totalItems}
                    </Badge>
                  )}
                </Button>

                {user ? (
                  <div className="flex flex-col items-center">
                    <User className="h-5 w-5" />
                    <span className="text-xs mt-1">Profile</span>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setAuthModalOpen(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Login
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen} 
      />

      {/* Cart Modal */}
      <FrontendCartModal 
        open={cartModalOpen}
        onOpenChange={setCartModalOpen}
      />
    </>
  );
};

export default FrontendNavbar;
