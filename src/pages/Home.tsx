import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import EnhancedHomeSearch from '@/components/home/EnhancedHomeSearch';
import ProductGridSmall from '@/components/home/ProductGridSmall';
import CompactBannerCarousel from '@/components/home/CompactBannerCarousel';
import EnhancedShippingInfo from '@/components/home/EnhancedShippingInfo';
import ModernFrontendFlashSale from '@/components/frontend/ModernFrontendFlashSale';
import CategoriesCarousel from '@/components/home/CategoriesCarousel';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import PersonalizedRecommendations from '@/components/home/PersonalizedRecommendations';
import WhatsAppFloatingButton from '@/components/frontend/WhatsAppFloatingButton';

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isMobile = useIsMobile();

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
      <FrontendNavbar 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
        searchComponent={
          <EnhancedHomeSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory} 
          />
        } 
      />

      <div className="container mx-auto px-4 py-6">
        <CompactBannerCarousel />
        <EnhancedShippingInfo />
        <PersonalizedRecommendations />
        <ModernFrontendFlashSale onProductClick={product => navigate(`/product/${product.id}`)} />

        <div className="mb-8">
          <h2 className="font-bold mb-6 text-destructive text-base">Produk Unggulan</h2>
          <ProductGridSmall searchTerm={searchTerm} selectedCategory={selectedCategory} limit={24} />
        </div>

        <CategoriesCarousel />
      </div>

      <MinimalFooter />
      
      {isMobile && <MobileBottomNav />}

      <WhatsAppFloatingButton className={isMobile ? 'bottom-24' : ''} />
    </div>
  );
};

export default Home;