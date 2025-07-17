
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Facebook, 
  Instagram, 
  Twitter,
  Heart,
  Star
} from 'lucide-react';

const EnhancedFooter = () => {
  const { data: settings } = useQuery({
    queryKey: ['store-settings-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  const getStoreInfo = (key: string) => {
    const setting = settings?.[key];
    if (typeof setting === 'object' && setting !== null) {
      return Object.values(setting)[0] || '';
    }
    return setting || '';
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Store Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6">
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {getStoreInfo('store_name') || 'SmartPOS'}
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed text-lg">
                Toko terpercaya dengan pelayanan terbaik untuk kebutuhan sehari-hari Anda. 
                Kami menyediakan berbagai produk berkualitas dengan harga terjangkau.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/20 p-3 rounded-xl">
                    <MapPin className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Alamat Toko</p>
                    <p className="text-gray-300">
                      {getStoreInfo('store_address') || 'Alamat toko belum diatur'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-green-500/20 p-3 rounded-xl">
                    <Phone className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Telepon</p>
                    <p className="text-gray-300">
                      {getStoreInfo('store_phone') || 'Nomor telepon belum diatur'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-xl">
                    <Mail className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Email</p>
                    <p className="text-gray-300">
                      {getStoreInfo('store_email') || 'Email belum diatur'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-orange-500/20 p-3 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Jam Buka</p>
                    <p className="text-gray-300">Senin - Minggu</p>
                    <p className="text-gray-300">08:00 - 22:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features & Social */}
          <div className="space-y-8">
            {/* Features */}
            <div>
              <h4 className="text-xl font-bold mb-4 text-blue-400">Mengapa Memilih Kami?</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-gray-300">Produk Berkualitas Tinggi</span>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-400 fill-current" />
                  <span className="text-gray-300">Pelayanan Ramah</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300">Pengiriman Cepat</span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-xl font-bold mb-4 text-blue-400">Ikuti Kami</h4>
              <div className="flex gap-4">
                <a 
                  href="#" 
                  className="group bg-gray-800 hover:bg-blue-600 p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                >
                  <Facebook className="h-5 w-5 group-hover:text-white" />
                </a>
                <a 
                  href="#" 
                  className="group bg-gray-800 hover:bg-pink-600 p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                >
                  <Instagram className="h-5 w-5 group-hover:text-white" />
                </a>
                <a 
                  href="#" 
                  className="group bg-gray-800 hover:bg-blue-400 p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                >
                  <Twitter className="h-5 w-5 group-hover:text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom bar */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-400">
                &copy; 2024 {getStoreInfo('store_name') || 'SmartPOS'}. Semua hak dilindungi.
              </p>
              <p className="text-gray-500 text-sm mt-1 flex items-center justify-center md:justify-start">
                Dibuat dengan <Heart className="h-4 w-4 mx-1 text-red-500" /> untuk memberikan pelayanan terbaik
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Kebijakan Privasi
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Syarat & Ketentuan
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;
