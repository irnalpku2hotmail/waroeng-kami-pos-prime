
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter,
  Store,
  Clock,
  ShieldCheck
} from 'lucide-react';

const EnhancedFooter = () => {
  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['footer-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  const storeInfo = settings?.store_info || {};
  const storeName = settings?.store_name?.name || 'Waroeng Kami';
  const contactInfo = settings?.contact_info || {};
  const socialMedia = settings?.social_media || {};

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{storeName}</h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {storeInfo.description || 'Toko online terpercaya dengan produk berkualitas dan pelayanan terbaik untuk kebutuhan sehari-hari Anda.'}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Terpercaya sejak 2020</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Hubungi Kami
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="h-4 w-4 text-blue-400" />
                <span>{contactInfo.phone || '+62 812-3456-7890'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>{contactInfo.email || 'info@waroengkami.com'}</span>
              </div>
              <div className="flex items-start gap-3 text-gray-300">
                <MapPin className="h-4 w-4 text-blue-400 mt-1" />
                <span>{contactInfo.address || 'Jl. Contoh No. 123, Jakarta Selatan, DKI Jakarta'}</span>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Jam Operasional
            </h3>
            <div className="space-y-2 text-gray-300">
              <div className="flex justify-between">
                <span>Senin - Jumat</span>
                <span>08:00 - 20:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sabtu</span>
                <span>08:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>Minggu</span>
                <span>10:00 - 16:00</span>
              </div>
              <div className="mt-3 p-3 bg-green-600/20 rounded-lg">
                <p className="text-green-300 text-sm">
                  💬 Customer service online 24/7
                </p>
              </div>
            </div>
          </div>

          {/* Social Media & Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ikuti Kami</h3>
            <div className="flex gap-3">
              {socialMedia.facebook && (
                <a 
                  href={socialMedia.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-600 p-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialMedia.instagram && (
                <a 
                  href={socialMedia.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-pink-600 p-3 rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialMedia.twitter && (
                <a 
                  href={socialMedia.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-sky-600 p-3 rounded-lg hover:bg-sky-700 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>

            {/* Information Links */}
            <div className="space-y-2">
              <h4 className="font-medium">Informasi</h4>
              <div className="space-y-1 text-sm">
                <Link to="/about" className="block text-gray-300 hover:text-white transition-colors">
                  Tentang Kami
                </Link>
                <Link to="/terms" className="block text-gray-300 hover:text-white transition-colors">
                  Syarat & Ketentuan
                </Link>
                <Link to="/privacy" className="block text-gray-300 hover:text-white transition-colors">
                  Kebijakan Privasi
                </Link>
                <Link to="/faq" className="block text-gray-300 hover:text-white transition-colors">
                  FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © 2024 {storeName}. Semua hak dilindungi.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>🚚 Gratis Ongkir</span>
              <span>💳 Bayar di Tempat</span>
              <span>🔒 Aman & Terpercaya</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
