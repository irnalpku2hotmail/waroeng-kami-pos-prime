
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Youtube, Heart } from 'lucide-react';

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
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              {storeInfo.logo_url && (
                <img 
                  src={storeInfo.logo_url} 
                  alt="TokoQu" 
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-400"
                />
              )}
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  TokoQu
                </h3>
                <p className="text-blue-300 text-sm">
                  {storeInfo.store_name || 'Toko Online Terpercaya'}
                </p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {storeInfo.description || 'TokoQu adalah toko online terpercaya dengan produk berkualitas dan pelayanan terbaik untuk kebutuhan Anda sehari-hari.'}
            </p>
            {storeInfo.tagline && (
              <p className="text-blue-400 font-medium text-sm italic">
                "{storeInfo.tagline}"
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-400" />
              Hubungi Kami
            </h4>
            <div className="space-y-4">
              {(contactInfo.store_address || contactInfo.address) && (
                <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Alamat Toko</p>
                    <p className="text-gray-300 text-sm">
                      {contactInfo.store_address || contactInfo.address}
                    </p>
                  </div>
                </div>
              )}
              {(contactInfo.store_phone || contactInfo.phone) && (
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Telepon</p>
                    <p className="text-gray-300 text-sm">
                      {contactInfo.store_phone || contactInfo.phone}
                    </p>
                  </div>
                </div>
              )}
              {(contactInfo.store_email || contactInfo.email) && (
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <p className="text-gray-300 text-sm">
                      {contactInfo.store_email || contactInfo.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Jam Operasional
            </h4>
            <div className="space-y-3">
              {businessHours.monday_friday && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <span className="text-gray-300 text-sm">Senin - Jumat</span>
                  <span className="text-white font-medium text-sm">{businessHours.monday_friday}</span>
                </div>
              )}
              {businessHours.saturday && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <span className="text-gray-300 text-sm">Sabtu</span>
                  <span className="text-white font-medium text-sm">{businessHours.saturday}</span>
                </div>
              )}
              {businessHours.sunday && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <span className="text-gray-300 text-sm">Minggu</span>
                  <span className="text-white font-medium text-sm">{businessHours.sunday}</span>
                </div>
              )}
              {!businessHours.monday_friday && !businessHours.saturday && !businessHours.sunday && (
                <div className="p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                  <p className="text-gray-300 text-sm">Buka setiap hari</p>
                  <p className="text-white font-medium text-sm">08:00 - 22:00 WIB</p>
                </div>
              )}
            </div>
          </div>

          {/* Social Media & Quick Info */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold mb-6">Ikuti Kami</h4>
            <div className="flex flex-wrap gap-3">
              {socialMedia.facebook && (
                <a 
                  href={socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all duration-300 hover:scale-110 shadow-lg"
                >
                  <Facebook className="h-6 w-6" />
                </a>
              )}
              {socialMedia.instagram && (
                <a 
                  href={socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-110 shadow-lg"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              {socialMedia.twitter && (
                <a 
                  href={socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center hover:bg-blue-500 transition-all duration-300 hover:scale-110 shadow-lg"
                >
                  <Twitter className="h-6 w-6" />
                </a>
              )}
              {socialMedia.youtube && (
                <a 
                  href={socialMedia.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center hover:bg-red-700 transition-all duration-300 hover:scale-110 shadow-lg"
                >
                  <Youtube className="h-6 w-6" />
                </a>
              )}
            </div>

            <div className="pt-4 space-y-4">
              <h5 className="font-semibold text-lg">Mengapa Pilih TokoQu?</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Produk Berkualitas Terjamin</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Harga Kompetitif</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Pelayanan Ramah & Cepat</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Pengiriman Terpercaya</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} TokoQu. Semua hak dilindungi.
            </p>
            <Heart className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Kebijakan Privasi
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Syarat & Ketentuan
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
              Bantuan & FAQ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
