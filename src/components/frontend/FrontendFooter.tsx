
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package, Phone, Mail, MapPin } from 'lucide-react';

const FrontendFooter = () => {
  // Fetch store settings
  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['store_name', 'store_phone', 'store_email', 'store_address']);
      
      if (error) throw error;
      
      const settings: Record<string, any> = {};
      data?.forEach(setting => {
        settings[setting.key] = setting.value;
      });
      
      return settings;
    }
  });

  const storeName = storeSettings?.store_name?.name || 'Waroeng Kami';
  const storePhone = storeSettings?.store_phone?.phone || '+62 812-3456-7890';
  const storeEmail = storeSettings?.store_email?.email || 'info@waroengkami.com';
  const storeAddress = storeSettings?.store_address?.address || 'Jl. Raya No. 123, Jakarta';

  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Store Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-400" />
                <h3 className="text-2xl font-bold">{storeName}</h3>
              </div>
              <p className="text-gray-400">
                Toko terpercaya untuk kebutuhan sehari-hari dengan kualitas terbaik dan harga bersahabat.
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Kontak Kami</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">{storePhone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">{storeEmail}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
                  <span className="text-gray-300">{storeAddress}</span>
                </div>
              </div>
            </div>
            
            {/* Operating Hours */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Jam Operasional</h4>
              <div className="space-y-2 text-gray-300">
                <div>Senin - Jumat: 08:00 - 22:00</div>
                <div>Sabtu - Minggu: 08:00 - 23:00</div>
                <div className="text-sm text-gray-400 mt-2">
                  *Jam operasional dapat berubah sewaktu-waktu
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <div className="text-sm text-gray-400">
              © 2024 {storeName}. Hak cipta dilindungi.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FrontendFooter;
