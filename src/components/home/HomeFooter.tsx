
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Mail, ShoppingCart, Facebook, Instagram, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomeFooter = () => {
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

  // Extract store information from settings
  const storeName = settings?.store_name?.name || 'TokoQu';
  const storeAddress = settings?.store_address?.address || '';
  const storeEmail = settings?.store_email?.email || '';
  const storePhone = settings?.store_phone?.phone || '';

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-400 mr-2" />
              <span className="font-bold text-xl">{storeName}</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Toko online terpercaya dengan produk berkualitas dan pelayanan terbaik untuk kebutuhan Anda.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Menu Cepat</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Beranda</Link></li>
              <li><Link to="/products" className="text-gray-300 hover:text-white transition-colors">Produk</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">Tentang Kami</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Kontak</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Layanan Pelanggan</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Panduan Belanja</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Syarat & Ketentuan</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Hubungi Kami</h3>
            <div className="space-y-3">
              {storeAddress && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{storeAddress}</span>
                </div>
              )}
              {storePhone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-blue-400" />
                  <a href={`tel:${storePhone}`} className="text-gray-300 hover:text-white transition-colors text-sm">
                    {storePhone}
                  </a>
                </div>
              )}
              {storeEmail && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <a href={`mailto:${storeEmail}`} className="text-gray-300 hover:text-white transition-colors text-sm">
                    {storeEmail}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 {storeName}. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
