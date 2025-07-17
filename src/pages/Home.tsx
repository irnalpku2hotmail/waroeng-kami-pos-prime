
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import HomeNavbar from '@/components/home/HomeNavbar';
import HomeHero from '@/components/home/HomeHero';
import EnhancedCategoriesSlider from '@/components/home/EnhancedCategoriesSlider';
import EnhancedFlashSale from '@/components/home/EnhancedFlashSale';
import HomeFooter from '@/components/home/HomeFooter';
import ShippingInfoDisplay from '@/components/home/ShippingInfoDisplay';
import BrandCarousel from '@/components/home/BrandCarousel';
import ProductGrid from '@/components/home/ProductGrid';
import { Button } from '@/components/ui/button';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Helmet } from 'react-helmet';

const Home = () => {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const { data: settings } = useStoreSettings();

  // Fetch featured products with limit
  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['featured-products', showAllProducts],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (!showAllProducts) {
        query = query.limit(10);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // SEO data from settings
  const seoTitle = settings?.seo_title || 'Toko Online';
  const seoDescription = settings?.seo_description || 'Belanja online mudah dan terpercaya';
  const seoKeywords = settings?.seo_keywords || 'toko online, belanja online';

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
      </Helmet>

      <HomeNavbar />
      
      <main className="pb-8">
        <HomeHero />
        
        <div className="container mx-auto px-4 space-y-8">
          <ShippingInfoDisplay />
          <EnhancedCategoriesSlider />
          <BrandCarousel />
          <EnhancedFlashSale />
          
          {/* Featured Products Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Produk Pilihan</h2>
              {!showAllProducts && featuredProducts && featuredProducts.length >= 10 && (
                <Button
                  variant="outline"
                  onClick={() => setShowAllProducts(true)}
                >
                  Lihat Lebih Banyak
                </Button>
              )}
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <ProductGrid products={featuredProducts || []} />
            )}
          </section>
        </div>
      </main>
      
      <HomeFooter />
    </div>
  );
};

export default Home;
