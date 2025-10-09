import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';

const SimpleFooter = () => {
  const { data: settings = [] } = useQuery({
    queryKey: ['settings-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  });

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, any>);

  const storeName = settingsMap.store_name || 'Toko Kami';
  const storeAddress = settingsMap.store_address || 'Jl. Contoh No. 123, Jakarta';
  const storePhone = settingsMap.store_phone || '+62 812-3456-7890';
  const storeEmail = settingsMap.store_email || 'info@toko.com';
  const operatingHours = settingsMap.operating_hours || 'Senin - Minggu: 08:00 - 22:00';
  const facebookUrl = settingsMap.facebook_url;
  const instagramUrl = settingsMap.instagram_url;
  const twitterUrl = settingsMap.twitter_url;

  return (
    <footer className="bg-blue-50 text-gray-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-4">{storeName}</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-blue-600" />
                <span className="text-sm">{storeAddress}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-3 flex-shrink-0 text-blue-600" />
                <span className="text-sm">{storePhone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-3 flex-shrink-0 text-blue-600" />
                <span className="text-sm">{storeEmail}</span>
              </div>
              <div className="flex items-start">
                <Clock className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-blue-600" />
                <span className="text-sm">{operatingHours}</span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Ikuti Kami</h3>
            <div className="flex space-x-4">
              {facebookUrl && (
                <a 
                  href={facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Facebook className="h-6 w-6" />
                </a>
              )}
              {instagramUrl && (
                <a 
                  href={instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              {twitterUrl && (
                <a 
                  href={twitterUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Twitter className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-200 mt-6 pt-6 text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} {storeName}. Semua hak dilindungi undang-undang.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SimpleFooter;
