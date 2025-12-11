import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import EnhancedHomeSearch from '@/components/home/EnhancedHomeSearch';
import ProductGridSmall from '@/components/home/ProductGridSmall';
import CompactBannerCarousel from '@/components/home/CompactBannerCarousel';
import EnhancedShippingInfo from '@/components/home/EnhancedShippingInfo';
import ModernFrontendFlashSale from '@/components/frontend/ModernFrontendFlashSale';
import CategoriesCarousel from '@/components/home/CategoriesCarousel';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import AuthModal from '@/components/AuthModal';
const Home = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isMobile = useIsMobile();
  return <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
      {/* Reusable Navbar */}
      <FrontendNavbar searchTerm={searchTerm} onSearchChange={setSearchTerm} onCartClick={() => setShowCartModal(true)} searchComponent={<EnhancedHomeSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Banner Carousel */}
        <CompactBannerCarousel />

        {/* Shipping Info */}
        <EnhancedShippingInfo />

        {/* Flash Sale */}
        <ModernFrontendFlashSale onProductClick={product => navigate(`/product/${product.id}`)} />

        {/* Products Section */}
        <div className="mb-8">
          <h2 className="font-bold mb-6 text-destructive text-base">Produk Unggulan</h2>
          <ProductGridSmall searchTerm={searchTerm} selectedCategory={selectedCategory} limit={24} />
        </div>

        {/* Categories Carousel */}
        <CategoriesCarousel />
      </div>

      {/* Minimal Footer */}
      <MinimalFooter />

      {/* Modals */}
      {user && <EnhancedFrontendCartModal open={showCartModal} onOpenChange={setShowCartModal} />}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav onCartClick={() => setShowCartModal(true)} onAuthClick={() => setAuthModalOpen(true)} />}
    </div>;
};
export default Home;