
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const HomeFooter = () => {
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

  const storeName = settings?.store_name || 'SmartPOS Store';
  const storeAddress = settings?.store_address || 'Alamat toko belum diatur';
  const storePhone = settings?.store_phone || 'Nomor telepon belum diatur';
  const storeEmail = settings?.store_email || 'Email belum diatur';
  const storeHours = settings?.store_hours || 'Jam operasional belum diatur';

  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">{storeName}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{storeAddress}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{storePhone}</p>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{storeEmail}</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm">{storeHours}</p>
              </div>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Tentang Kami</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Kami adalah toko online terpercaya yang menyediakan berbagai produk berkualitas 
              dengan harga yang kompetitif. Kepuasan pelanggan adalah prioritas utama kami.
            </p>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Layanan Pelanggan</h3>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                Hubungi kami jika Anda memiliki pertanyaan atau membutuhkan bantuan.
              </p>
              <p className="text-gray-300 text-sm">
                Tim customer service siap membantu Anda 24/7.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 {storeName}. Semua hak dilindungi undang-undang.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
