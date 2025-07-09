
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, User, Star, Gift } from 'lucide-react';

interface CustomerQRCodeProps {
  customerId: string;
}

const CustomerQRCode = ({ customerId }: CustomerQRCodeProps) => {
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

  const { data: customer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId
  });

  const storeName = storeSettings?.store_name?.name || 'Waroeng Kami';

  if (!customer) return null;

  return (
    <div className="max-w-md mx-auto">
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white overflow-hidden">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Gift className="h-6 w-6" />
            <CardTitle className="text-lg font-bold">{storeName}</CardTitle>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 mx-auto">
            Member Card
          </Badge>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {/* Customer Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <User className="h-4 w-4" />
              <span className="font-semibold">{customer.name}</span>
            </div>
            <div className="text-sm opacity-90">{customer.customer_code}</div>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-white p-4 rounded-xl mx-auto w-32 h-32 flex items-center justify-center">
            <QrCode className="h-20 w-20 text-gray-800" />
          </div>

          {/* Points */}
          <div className="bg-white/20 rounded-lg p-3">
            <div className="flex items-center justify-center space-x-2">
              <Star className="h-4 w-4 text-yellow-300" />
              <span className="text-sm">Poin Tersedia</span>
            </div>
            <div className="text-2xl font-bold">{customer.total_points}</div>
          </div>

          {/* Footer */}
          <div className="text-xs opacity-75 mt-4">
            Terima kasih atas kepercayaan Anda
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerQRCode;
