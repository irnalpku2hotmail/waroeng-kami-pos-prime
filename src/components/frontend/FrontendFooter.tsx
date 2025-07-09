
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Mail } from 'lucide-react';

const FrontendFooter = () => {
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['store_name', 'store_phone', 'store_address', 'store_email']);
      
      if (error) throw error;
      
      const settings: Record<string, any> = {};
      data?.forEach((setting) => {
        settings[setting.key] = setting.value;
      });
      
      return settings;
    }
  });

  const storeName = storeSettings?.store_name?.name || 'Waroeng Kami';
  const storePhone = storeSettings?.store_phone?.phone || '+62 812-3456-7890';
  const storeAddress = storeSettings?.store_address?.address || 'Jl. Raya No. 123, Jakarta';
  const storeEmail = storeSettings?.store_email?.email || 'info@waroengkami.com';

  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Store Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">{storeName}</h3>
            <p className="text-gray-300 mb-4">
              Belanja mudah, cepat, dan terpercaya. Dapatkan produk berkualitas dengan harga terbaik.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Kontak Kami</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">{storeAddress}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">{storePhone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">{storeEmail}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Layanan</h4>
            <div className="space-y-2">
              <p className="text-gray-300">• Belanja Online</p>
              <p className="text-gray-300">• Program Loyalitas</p>
              <p className="text-gray-300">• Pengiriman Cepat</p>
              <p className="text-gray-300">• Customer Support</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 {storeName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FrontendFooter;
