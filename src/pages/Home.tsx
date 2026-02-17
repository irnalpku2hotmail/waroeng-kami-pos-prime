import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import EnhancedHomeSearch from '@/components/home/EnhancedHomeSearch';
import CompactBannerCarousel from '@/components/home/CompactBannerCarousel';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import AuthModal from '@/components/AuthModal';
import WhatsAppFloatingButton from '@/components/frontend/WhatsAppFloatingButton';

// Lazy load below-fold components to improve Speed Index
const ProductGridSmall = lazy(() => import('@/components/home/ProductGridSmall'));
const EnhancedShippingInfo = lazy(() => import('@/components/home/EnhancedShippingInfo'));
const ModernFrontendFlashSale = lazy(() => import('@/components/frontend/ModernFrontendFlashSale'));
const CategoriesCarousel = lazy(() => import('@/components/home/CategoriesCarousel'));
const PersonalizedRecommendations = lazy(() => import('@/components/home/PersonalizedRecommendations'));

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
      {/* Reusable Navbar */}
      <FrontendNavbar 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
        onCartClick={() => setShowCartModal(true)} 
        searchComponent={
          <EnhancedHomeSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory} 
          />
        } 
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Banner Carousel */}
        <CompactBannerCarousel />

        {/* Shipping Info - placeholder matches component height to prevent CLS */}
        <Suspense fallback={
          <div className="mb-8 min-h-[328px] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 shadow-lg border border-blue-100 animate-pulse" />
        }>
          <EnhancedShippingInfo />
        </Suspense>

        {/* Personalized Recommendations */}
        <Suspense fallback={null}>
          <PersonalizedRecommendations onAuthRequired={() => setAuthModalOpen(true)} />
        </Suspense>

        {/* Flash Sale */}
        <Suspense fallback={null}>
          <ModernFrontendFlashSale onProductClick={product => navigate(`/product/${product.id}`)} onAuthRequired={() => setAuthModalOpen(true)} />
        </Suspense>

        {/* Products Section */}
        <div className="mb-8 min-h-[450px]">
          <Suspense fallback={<div className="min-h-[450px] flex gap-3 overflow-hidden animate-pulse"><div className="flex-shrink-0 w-36 h-40 bg-muted rounded-lg" /><div className="flex-shrink-0 w-36 h-40 bg-muted rounded-lg" /><div className="flex-shrink-0 w-36 h-40 bg-muted rounded-lg" /></div>}>
            <ProductGridSmall searchTerm={searchTerm} selectedCategory={selectedCategory} limit={24} onAuthRequired={() => setAuthModalOpen(true)} />
          </Suspense>
        </div>

        {/* Categories Carousel */}
        <Suspense fallback={null}>
          <CategoriesCarousel />
        </Suspense>
      </div>

      {/* Minimal Footer */}
      <MinimalFooter />

      {/* Modals - Show cart for all users but require login */}
      <EnhancedFrontendCartModal open={showCartModal} onOpenChange={setShowCartModal} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav onCartClick={() => setShowCartModal(true)} onAuthClick={() => setAuthModalOpen(true)} />}

      {/* WhatsApp Floating Button */}
      <WhatsAppFloatingButton className={isMobile ? 'bottom-24' : ''} />
    </div>
  );
};

export default Home;