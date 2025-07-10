
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';

const FrontendFooter = () => {
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

  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              {storeInfo.name || 'Toko Online'}
            </h3>
            <p className="text-gray-400 mb-4 leading-relaxed">
              {storeInfo.description || 'Toko online terpercaya dengan produk berkualitas dan pelayanan terbaik untuk kebutuhan Anda.'}
            </p>
            {/* Social Media */}
            <div className="flex space-x-4">
              {socialMedia?.facebook && (
                <a href={socialMedia.facebook} className="text-gray-400 hover:text-blue-500 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialMedia?.instagram && (
                <a href={socialMedia.instagram} className="text-gray-400 hover:text-pink-500 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialMedia?.twitter && (
                <a href={socialMedia.twitter} className="text-gray-400 hover:text-blue-400 transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tautan Cepat</h3>
            <ul className="space-y-2">
              <li><a href="#home" className="text-gray-400 hover:text-white transition-colors">Beranda</a></li>
              <li><a href="#products" className="text-gray-400 hover:text-white transition-colors">Produk</a></li>
              <li><a href="#categories" className="text-gray-400 hover:text-white transition-colors">Kategori</a></li>
              <li><a href="#flash-sale" className="text-gray-400 hover:text-white transition-colors">Flash Sale</a></li>
              <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">Tentang Kami</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Layanan Pelanggan</h3>
            <ul className="space-y-2">
              <li><a href="#help" className="text-gray-400 hover:text-white transition-colors">Bantuan</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#shipping" className="text-gray-400 hover:text-white transition-colors">Info Pengiriman</a></li>
              <li><a href="#returns" className="text-gray-400 hover:text-white transition-colors">Kebijakan Return</a></li>
              <li><a href="#privacy" className="text-gray-400 hover:text-white transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>

          {/* Contact Info - using both store_info and contact_info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hubungi Kami</h3>
            <div className="space-y-3">
              {(storeInfo?.address || contactInfo?.address) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 text-sm leading-relaxed">
                    {storeInfo.address || contactInfo.address}
                  </span>
                </div>
              )}
              
              {(storeInfo?.phone || contactInfo?.phone) && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">
                    {storeInfo.phone || contactInfo.phone}
                  </span>
                </div>
              )}
              
              {(storeInfo?.email || contactInfo?.email) && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-400 text-sm">
                    {storeInfo.email || contactInfo.email}
                  </span>
                </div>
              )}
              
              {contactInfo?.operating_hours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400 text-sm leading-relaxed">
                    {contactInfo.operating_hours}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        {/* Bottom Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {storeInfo.name || 'Toko Online'}. Semua hak dilindungi.</p>
          <p className="mt-1">Dibuat dengan ❤️ untuk memberikan pengalaman belanja terbaik</p>
        </div>
      </div>
    </footer>
  );
};

export default FrontendFooter;
