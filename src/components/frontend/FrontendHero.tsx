
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Star, Users, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FrontendHeroProps {
  storeName: string;
}

const FrontendHero = ({ storeName }: FrontendHeroProps) => {
  // Fetch banner images from frontend settings
  const { data: settings } = useQuery({
    queryKey: ['frontend-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['hero_banner_1', 'hero_banner_2', 'hero_banner_3']);
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  const bannerImages = [
    settings?.hero_banner_1?.url || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=2000&q=80',
    settings?.hero_banner_2?.url || 'https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?auto=format&fit=crop&w=2000&q=80',
    settings?.hero_banner_3?.url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=2000&q=80'
  ];

  const backgroundPattern = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3Ccircle cx='40' cy='40' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 animate-pulse" 
        style={{ backgroundImage: `url("${backgroundPattern}")` }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6 items-center">
          {/* Content */}
          <div className="space-y-3 md:space-y-4">
            <div className="space-y-2 md:space-y-3">
              <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">
                Selamat Datang di{' '}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  {storeName}
                </span>
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-blue-100 leading-relaxed">
                Temukan produk terbaik dengan harga terjangkau. Belanja mudah, cepat, dan terpercaya.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 py-2 md:py-3">
              <div className="text-center">
                <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded-full mx-auto mb-1">
                  <ShoppingBag className="h-3 w-3 md:h-4 md:w-4" />
                </div>
                <div className="text-sm md:text-lg font-bold">1000+</div>
                <div className="text-xs text-blue-200">Produk</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded-full mx-auto mb-1">
                  <Users className="h-3 w-3 md:h-4 md:w-4" />
                </div>
                <div className="text-sm md:text-lg font-bold">5000+</div>
                <div className="text-xs text-blue-200">Pelanggan</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white/10 rounded-full mx-auto mb-1">
                  <Star className="h-3 w-3 md:h-4 md:w-4" />
                </div>
                <div className="text-sm md:text-lg font-bold">4.8</div>
                <div className="text-xs text-blue-200">Rating</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold text-sm md:text-base">
                Mulai Belanja
                <ChevronRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button size="sm" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-sm md:text-base">
                Lihat Produk
              </Button>
            </div>
          </div>

          {/* Hero Images - Reduced height for mobile */}
          <div className="relative h-32 md:h-48 lg:h-60">
            <div className="grid grid-cols-2 gap-2 md:gap-3 h-full">
              <div className="space-y-2 md:space-y-3">
                <div className="relative h-16 md:h-24 lg:h-32 rounded-lg md:rounded-xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <img 
                    src={bannerImages[0]}
                    alt="Hero 1" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="relative h-12 md:h-20 lg:h-24 rounded-lg md:rounded-xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <img 
                    src={bannerImages[1]}
                    alt="Hero 2" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
              <div className="mt-3 md:mt-6">
                <div className="relative h-24 md:h-36 lg:h-48 rounded-lg md:rounded-xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <img 
                    src={bannerImages[2]}
                    alt="Hero 3" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
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
