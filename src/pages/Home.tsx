
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeHero from '@/components/home/HomeHero';
import HomeCategoriesSlider from '@/components/home/HomeCategoriesSlider';
import HomeFlashSale from '@/components/home/HomeFlashSale';
import ProductGrid from '@/components/home/ProductGrid';
import HomeFooter from '@/components/home/HomeFooter';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface HomeProduct {
  id: string;
  name: string;
  selling_price: number;
  image_url: string;
  current_stock: number;
  description: string | null;
  categories: { id: string; name: string };
  units: { name: string; abbreviation: string };
  price_variants: any[];
}

const Home = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['frontend-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          units(name, abbreviation),
          price_variants(*)
        `)
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

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
      return data || [];
    }
  });

  const handleCartClick = () => {
    // Handle cart click - could open cart modal
    console.log('Cart clicked');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HomeNavbar 
        onCartClick={handleCartClick}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <section className="mb-8">
          <HomeHero />
        </section>

        {/* Categories Section */}
        <section className="mb-8">
          <HomeCategoriesSlider />
        </section>

        {/* Flash Sale Section */}
        <section className="mb-12">
          <HomeFlashSale flashSales={flashSales} />
        </section>

        {/* Products Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Semua Produk</h2>
          </div>
          <ProductGrid products={products as HomeProduct[]} isLoading={isLoading} />
        </section>
      </main>

      <HomeFooter />
    </div>
  );
};

export default Home;
