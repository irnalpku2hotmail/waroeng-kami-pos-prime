import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLazySection } from '@/hooks/useLazySection';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import EnhancedHomeSearch from '@/components/home/EnhancedHomeSearch';
import CompactBannerCarousel from '@/components/home/CompactBannerCarousel';
import AuthModal from '@/components/AuthModal';
import WhatsAppFloatingButton from '@/components/frontend/WhatsAppFloatingButton';

// Lazy load below-the-fold sections
const EnhancedShippingInfo = lazy(() => import('@/components/home/EnhancedShippingInfo'));
const PersonalizedRecommendations = lazy(() => import('@/components/home/PersonalizedRecommendations'));
const ModernFrontendFlashSale = lazy(() => import('@/components/frontend/ModernFrontendFlashSale'));
const ProductGridSmall = lazy(() => import('@/components/home/ProductGridSmall'));
const CategoriesCarousel = lazy(() => import('@/components/home/CategoriesCarousel'));
const MinimalFooter = lazy(() => import('@/components/frontend/MinimalFooter'));
const MobileBottomNav = lazy(() => import('@/components/home/MobileBottomNav'));

const SectionPlaceholder = ({ height = 'h-40' }: { height?: string }) => (
  <div className={`${height} flex items-center justify-center`}>
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
  </div>
);

const LazySection = ({ children, height = 'h-40', rootMargin = '300px' }: { children: React.ReactNode; height?: string; rootMargin?: string }) => {
  const { ref, isVisible } = useLazySection(rootMargin);
  return (
    <div ref={ref}>
      {isVisible ? (
        <Suspense fallback={<SectionPlaceholder height={height} />}>
          {children}
        </Suspense>
      ) : (
        <SectionPlaceholder height={height} />
      )}
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-16' : ''}`}>
      {/* Sticky Navbar - edge to edge */}
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

      {/* Banner - full width, no container padding on mobile */}
      <div className={isMobile ? 'px-0 pt-2' : 'px-4 pt-4 max-w-7xl mx-auto'}>
        <CompactBannerCarousel />
      </div>

      {/* Main Content */}
      <div className={isMobile ? 'px-3 py-2' : 'px-4 py-4 max-w-7xl mx-auto'}>
        {/* Shipping Info - lazy */}
        <LazySection height="h-32" rootMargin="100px">
          <EnhancedShippingInfo />
        </LazySection>

        {/* Recommendations - lazy */}
        <LazySection height="h-56">
          <PersonalizedRecommendations onAuthRequired={() => setAuthModalOpen(true)} />
        </LazySection>
      </div>

      {/* Flash Sale - full bleed */}
      <LazySection height="h-64">
        <ModernFrontendFlashSale onProductClick={product => navigate(`/product/${product.id}`)} onAuthRequired={() => setAuthModalOpen(true)} />
      </LazySection>

      {/* Products & Categories */}
      <div className={isMobile ? 'px-3 py-2' : 'px-4 py-4 max-w-7xl mx-auto'}>
        <LazySection height="h-64">
          <div className="mb-6">
            <ProductGridSmall searchTerm={searchTerm} selectedCategory={selectedCategory} limit={24} onAuthRequired={() => setAuthModalOpen(true)} />
          </div>
        </LazySection>

        <LazySection height="h-48">
          <CategoriesCarousel />
        </LazySection>
      </div>

      {/* Footer - lazy */}
      <LazySection height="h-48" rootMargin="200px">
        <MinimalFooter />
      </LazySection>

      {/* Modals */}
      <EnhancedFrontendCartModal open={showCartModal} onOpenChange={setShowCartModal} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Suspense fallback={null}>
          <MobileBottomNav onCartClick={() => setShowCartModal(true)} onAuthClick={() => setAuthModalOpen(true)} />
        </Suspense>
      )}

      {/* WhatsApp Floating Button */}
      <WhatsAppFloatingButton className={isMobile ? 'bottom-20' : ''} />
    </div>
  );
};

export default Home;
