
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
  Globe
} from 'lucide-react';

const HomeFooter = () => {
  // Fetch store settings
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
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4 text-blue-400">
              {getStoreInfo('store_name') || 'SmartPOS'}
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Toko terpercaya dengan pelayanan terbaik untuk kebutuhan sehari-hari Anda. 
              Kami menyediakan berbagai produk berkualitas dengan harga terjangkau.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Alamat Toko</p>
                  <p className="text-gray-300 text-sm">
                    {getStoreInfo('store_address') || 'Alamat toko belum diatur'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Telepon</p>
                  <p className="text-gray-300 text-sm">
                    {getStoreInfo('store_phone') || 'Nomor telepon belum diatur'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Email</p>
                  <p className="text-gray-300 text-sm">
                    {getStoreInfo('store_email') || 'Email belum diatur'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-blue-400">Tautan Cepat</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="/home" 
                  className="text-gray-300 hover:text-blue-400 transition-colors flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Beranda
                </a>
              </li>
              <li>
                <a 
                  href="/products" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Semua Produk
                </a>
              </li>
              <li>
                <a 
                  href="/categories" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Kategori
                </a>
              </li>
              <li>
                <a 
                  href="/orders" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Pesanan Saya
                </a>
              </li>
              <li>
                <a 
                  href="/profile" 
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                >
                  Profil
                </a>
              </li>
            </ul>
          </div>

          {/* Operating Hours & Social Media */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-blue-400">Jam Operasional</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Senin - Jumat</p>
                  <p className="text-gray-300 text-sm">08:00 - 17:00</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Sabtu - Minggu</p>
                  <p className="text-gray-300 text-sm">09:00 - 16:00</p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-medium mb-3 text-white">Ikuti Kami</h4>
              <div className="flex gap-3">
                <a 
                  href="#" 
                  className="bg-gray-800 hover:bg-blue-600 p-2 rounded-full transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="bg-gray-800 hover:bg-pink-600 p-2 rounded-full transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="#" 
                  className="bg-gray-800 hover:bg-blue-400 p-2 rounded-full transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; 2024 {getStoreInfo('store_name') || 'SmartPOS'}. Semua hak dilindungi.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Kebijakan Privasi
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Syarat & Ketentuan
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Bantuan
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
