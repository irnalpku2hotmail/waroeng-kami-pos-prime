
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowRight } from 'lucide-react';

interface FrontendHeroProps {
  storeName?: string;
  onProductClick?: (product: any) => void;
}

const FrontendHero = ({ storeName = 'Waroeng Kami', onProductClick }: FrontendHeroProps) => {
  // Fetch store settings for hero content
  const { data: settings } = useQuery({
    queryKey: ['store-settings-hero'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['store_name', 'store_description', 'hero_title', 'hero_subtitle']);
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  const storeDisplayName = settings?.store_name?.name || storeName;
  const storeDescription = settings?.store_description?.description || 'Toko online terpercaya dengan produk berkualitas tinggi';
  const heroTitle = settings?.hero_title?.title || `Selamat Datang di ${storeDisplayName}`;
  const heroSubtitle = settings?.hero_subtitle?.subtitle || 'Temukan produk terbaik dengan harga terjangkau';

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="hero-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="2" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hero-pattern)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {heroTitle}
              </h1>
              <p className="text-lg lg:text-xl text-gray-600 max-w-2xl">
                {heroSubtitle}
              </p>
              <p className="text-base text-gray-500">
                {storeDescription}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Mulai Belanja
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg"
              >
                Lihat Katalog
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Produk Berkualitas</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 text-xl">🚚</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Pengiriman Cepat</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 text-xl">💳</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Pembayaran Mudah</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/placeholder.svg"
                alt="Hero Image"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-4 transform -rotate-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Terpercaya</p>
                  <p className="text-xs text-gray-500">1000+ Customer</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 transform rotate-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🎯</span>
                </div>
                <div>
                  <p className="text-xs font-medium">Flash Sale</p>
                  <p className="text-xs text-gray-500">Diskon 50%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FrontendHero;
