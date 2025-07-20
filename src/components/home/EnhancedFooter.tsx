
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Store,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Globe
} from 'lucide-react';

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

  const storeInfo = settings?.store_info || {};
  const storeName = settings?.store_name?.name || 'Waroeng Kami';
  const logoUrl = settings?.store_logo?.url || null;

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Store Information */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={storeName} 
                    className="h-10 w-10 object-cover rounded-lg"
                  />
                ) : (
                  <Store className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{storeName}</h2>
                <p className="text-blue-200 font-medium">Toko Online Terpercaya</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              {storeInfo.description || 'Menyediakan berbagai produk berkualitas dengan pelayanan terbaik untuk kepuasan pelanggan.'}
            </p>

            {/* Contact Information */}
            <div className="space-y-4">
              {storeInfo.address && (
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600/20 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Alamat</p>
                    <p className="text-gray-300 text-sm">{storeInfo.address}</p>
                  </div>
                </div>
              )}
              
              {storeInfo.phone && (
                <div className="flex items-center space-x-3">
                  <div className="bg-green-600/20 p-2 rounded-lg">
                    <Phone className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Telepon</p>
                    <p className="text-gray-300 text-sm">{storeInfo.phone}</p>
                  </div>
                </div>
              )}
              
              {storeInfo.email && (
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-600/20 p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <p className="text-gray-300 text-sm">{storeInfo.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Jam Operasional
            </h3>
            <div className="space-y-3">
              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                <p className="font-medium text-white">Senin - Jumat</p>
                <p className="text-blue-200 text-sm">{storeInfo.weekday_hours || '08:00 - 21:00'}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                <p className="font-medium text-white">Sabtu - Minggu</p>
                <p className="text-blue-200 text-sm">{storeInfo.weekend_hours || '09:00 - 22:00'}</p>
              </div>
            </div>
          </div>

          {/* Quick Links & Social Media */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Ikuti Kami</h3>
            
            {/* Social Media Links */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {storeInfo.facebook && (
                <a 
                  href={storeInfo.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-600/20 hover:bg-blue-600 p-3 rounded-xl transition-all duration-300 flex items-center justify-center group"
                >
                  <Facebook className="h-5 w-5 text-blue-400 group-hover:text-white" />
                </a>
              )}
              
              {storeInfo.instagram && (
                <a 
                  href={storeInfo.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-pink-600/20 hover:bg-pink-600 p-3 rounded-xl transition-all duration-300 flex items-center justify-center group"
                >
                  <Instagram className="h-5 w-5 text-pink-400 group-hover:text-white" />
                </a>
              )}
              
              {storeInfo.twitter && (
                <a 
                  href={storeInfo.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-sky-600/20 hover:bg-sky-600 p-3 rounded-xl transition-all duration-300 flex items-center justify-center group"
                >
                  <Twitter className="h-5 w-5 text-sky-400 group-hover:text-white" />
                </a>
              )}
              
              {storeInfo.website && (
                <a 
                  href={storeInfo.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-green-600/20 hover:bg-green-600 p-3 rounded-xl transition-all duration-300 flex items-center justify-center group"
                >
                  <Globe className="h-5 w-5 text-green-400 group-hover:text-white" />
                </a>
              )}
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <h4 className="font-semibold text-white mb-3">Menu Cepat</h4>
              <a href="/" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300 py-1">
                Beranda
              </a>
              <a href="/products" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300 py-1">
                Produk
              </a>
              <a href="/order-history" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300 py-1">
                Riwayat Pesanan
              </a>
              <a href="/profile" className="block text-gray-300 hover:text-blue-400 transition-colors duration-300 py-1">
                Profil
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-300 text-sm">
                © {new Date().getFullYear()} {storeName}. Semua hak dilindungi.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Dibuat dengan ❤️ untuk pelanggan terbaik
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-blue-400 transition-colors duration-300">
                Syarat & Ketentuan
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors duration-300">
                Kebijakan Privasi
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors duration-300">
                Bantuan
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
