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
const CategoryGrid = lazy(() => import('@/components/home/CategoryGrid'));
const BrandScroller = lazy(() => import('@/components/home/BrandScroller'));
const ModernFrontendFlashSale = lazy(() => import('@/components/frontend/ModernFrontendFlashSale'));
const BundleCarousel = lazy(() => import('@/components/bundles/BundleCarousel'));
const PromoProducts = lazy(() => import('@/components/home/PromoProducts'));
const AllProducts = lazy(() => import('@/components/home/AllProducts'));
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
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const isMobile = useIsMobile();

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedBrand('all');
  };

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-16' : ''} ${isMobile ? 'pt-12' : 'pt-[88px]'}`}>
      {/* Fixed Navbar */}
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

      {/* 1. Banner Promo */}
      <div className={isMobile ? 'px-0 pt-2' : 'px-4 pt-4 max-w-7xl mx-auto'}>
        <CompactBannerCarousel />
      </div>

      {/* Content area - clean spacing */}
      <div className={isMobile ? 'px-3 space-y-5' : 'px-4 max-w-7xl mx-auto space-y-8'}>
        {/* Shipping Info */}
        <LazySection height="h-16" rootMargin="100px">
          <EnhancedShippingInfo />
        </LazySection>

        {/* 2. Kategori Grid */}
        <LazySection height="h-32" rootMargin="200px">
          <CategoryGrid />
        </LazySection>

        {/* 3. Brand Carousel */}
        <LazySection height="h-24" rootMargin="200px">
          <BrandScroller />
        </LazySection>
      </div>

      {/* 4. Flash Sale - full bleed */}
      <div className="mt-5 md:mt-8">
        <LazySection height="h-48">
          <ModernFrontendFlashSale
            onProductClick={product => navigate(`/product/${product.id}`)}
            onAuthRequired={() => setAuthModalOpen(true)}
          />
        </LazySection>
      </div>

      {/* Content sections */}
      <div className={isMobile ? 'px-3 space-y-5 mt-5' : 'px-4 max-w-7xl mx-auto space-y-8 mt-8'}>
        {/* Bundle Deals */}
        <LazySection height="h-48">
          <BundleCarousel />
        </LazySection>

        {/* 5. Promo / Rekomendasi */}
        <LazySection height="h-64">
          <PromoProducts onAuthRequired={() => setAuthModalOpen(true)} />
        </LazySection>

        {/* Separator */}
        <div className="border-t border-border/30" />

        {/* 6. Semua Produk */}
        <LazySection height="h-64">
          <AllProducts
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            onAuthRequired={() => setAuthModalOpen(true)}
            onClearFilters={clearFilters}
          />
        </LazySection>
      </div>

      {/* Footer */}
      <div className="mt-8">
        <LazySection height="h-48" rootMargin="200px">
          <MinimalFooter />
        </LazySection>
      </div>

      {/* Modals */}
      <EnhancedFrontendCartModal open={showCartModal} onOpenChange={setShowCartModal} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <Suspense fallback={null}>
          <MobileBottomNav onCartClick={() => setShowCartModal(true)} onAuthClick={() => setAuthModalOpen(true)} />
        </Suspense>
      )}

      {/* WhatsApp */}
      <WhatsAppFloatingButton className={isMobile ? 'bottom-20' : ''} />
    </div>
  );
};

export default Home;
