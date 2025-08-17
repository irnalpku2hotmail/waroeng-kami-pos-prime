
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeHero from '@/components/home/HomeHero';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import HomeFlashSale from '@/components/home/HomeFlashSale';
import ProductGrid from '@/components/home/ProductGrid';
import EnhancedFooter from '@/components/home/EnhancedFooter';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';

const Home = () => {
  const { user } = useAuth();
  const { getTotalItems } = useCart();
  const [showCartModal, setShowCartModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch flash sales
  const { data: flashSales = [] } = useQuery({
    queryKey: ['flash-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          flash_sale_items(
            *,
            products(*)
          )
        `)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          units(name, abbreviation)
        `)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar 
        onCartClick={() => user && setShowCartModal(true)} 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      {/* Hero Banner with reduced height on mobile */}
      <div className="h-32 md:h-48 lg:h-64">
        <HomeHero />
      </div>
      
      <div className="container mx-auto px-4 py-6 space-y-8">
        <HomeCategoriesSlider />
        
        {flashSales.length > 0 && (
          <HomeFlashSale flashSales={flashSales} />
        )}
        
        <ProductGrid products={products} />
      </div>
      
      <EnhancedFooter />
      
      {/* Only show cart modal if user is logged in */}
      {user && (
        <EnhancedFrontendCartModal 
          open={showCartModal} 
          onOpenChange={setShowCartModal} 
        />
      )}
    </div>
  );
};

export default Home;
