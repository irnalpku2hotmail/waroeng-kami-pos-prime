
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const HomeFooter = () => {
  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
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
  const contactInfo = settings?.contact_info || {};
  const socialMedia = settings?.social_media || {};
  const businessHours = settings?.business_hours || {};

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {storeInfo.logo_url && (
                <img 
                  src={storeInfo.logo_url} 
                  alt={storeInfo.name} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <h3 className="text-xl font-bold">
                {storeInfo.name || 'Toko Online'}
              </h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {storeInfo.description || 'Toko online terpercaya dengan produk berkualitas dan pelayanan terbaik.'}
            </p>
            {storeInfo.tagline && (
              <p className="text-blue-400 font-medium text-sm">
                "{storeInfo.tagline}"
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Kontak Kami</h4>
            <div className="space-y-3">
              {contactInfo.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">
                    {contactInfo.address}
                  </span>
                </div>
              )}
              {contactInfo.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">
                    {contactInfo.phone}
                  </span>
                </div>
              )}
              {contactInfo.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">
                    {contactInfo.email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Jam Operasional</h4>
            <div className="space-y-2">
              {businessHours.monday_friday && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="text-gray-300">Senin - Jumat</div>
                    <div className="text-white font-medium">{businessHours.monday_friday}</div>
                  </div>
                </div>
              )}
              {businessHours.saturday && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="text-gray-300">Sabtu</div>
                    <div className="text-white font-medium">{businessHours.saturday}</div>
                  </div>
                </div>
              )}
              {businessHours.sunday && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="text-gray-300">Minggu</div>
                    <div className="text-white font-medium">{businessHours.sunday}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Media & Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Ikuti Kami</h4>
            <div className="flex space-x-4">
              {socialMedia.facebook && (
                <a 
                  href={socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialMedia.instagram && (
                <a 
                  href={socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialMedia.twitter && (
                <a 
                  href={socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {socialMedia.youtube && (
                <a 
                  href={socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>

            <div className="pt-4 space-y-2">
              <h5 className="font-medium text-sm">Tautan Cepat</h5>
              <div className="space-y-1">
                <a href="#products" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Produk
                </a>
                <a href="#categories" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Kategori
                </a>
                <a href="#flash-sale" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Flash Sale
                </a>
                <a href="#about" className="block text-gray-300 hover:text-white text-sm transition-colors">
                  Tentang Kami
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {storeInfo.name || 'Toko Online'}. Semua hak dilindungi.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Kebijakan Privasi
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Syarat & Ketentuan
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Bantuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
