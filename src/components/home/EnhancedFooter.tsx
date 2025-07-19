
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from 'lucide-react';

const EnhancedFooter = () => {
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

  // Get store information from settings
  const storeName = settings?.store_name?.name || 'Waroeng Kami';
  const storeAddress = settings?.store_address?.address || 'Alamat toko belum diatur';
  const storePhone = settings?.store_phone?.phone || 'Nomor telepon belum diatur';
  const storeEmail = settings?.store_email?.email || 'Email belum diatur';
  const storeDescription = settings?.store_info?.description || 'Toko online terpercaya dengan produk berkualitas dan pelayanan terbaik untuk kebutuhan sehari-hari Anda.';
  const storeLogo = settings?.store_logo?.url || '';

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {storeLogo && (
                <img 
                  src={storeLogo} 
                  alt={storeName} 
                  className="h-10 w-10 rounded-full"
                />
              )}
              <h3 className="text-xl font-bold text-white">
                {storeName}
              </h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {storeDescription}
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="p-2 bg-pink-600 hover:bg-pink-700 rounded-full transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Hubungi Kami</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">{storePhone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">{storeEmail}</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-blue-400 mt-1" />
                <span className="text-gray-300">{storeAddress}</span>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Jam Operasional</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-gray-300">Senin - Jumat</p>
                  <p className="text-sm text-gray-400">08:00 - 22:00</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-gray-300">Sabtu - Minggu</p>
                  <p className="text-sm text-gray-400">09:00 - 21:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Dapatkan Update</h4>
            <p className="text-gray-300">Berlangganan untuk mendapatkan penawaran terbaru dan promo menarik</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Email Anda"
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-r-lg transition-colors">
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} {storeName}. Semua hak dilindungi.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Syarat & Ketentuan
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                Kebijakan Privasi
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
