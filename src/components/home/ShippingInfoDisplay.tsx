
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Clock, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ShippingInfoDisplay = () => {
  const { user } = useAuth();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  if (!user || !profile) return null;

  return (
    <div className="mb-8">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Informasi Pengiriman
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700">Alamat Pengiriman</p>
                <p className="text-blue-600 text-sm">
                  {profile.address_text || profile.address || 'Belum ada alamat'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700">Estimasi Pengiriman</p>
                <p className="text-blue-600 text-sm">1-2 hari kerja</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700">Ongkos Kirim</p>
                <p className="text-blue-600 text-sm">Rp 10.000</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingInfoDisplay;
