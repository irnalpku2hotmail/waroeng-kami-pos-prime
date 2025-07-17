
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RefreshCw, Truck, Clock, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const EnhancedShippingInfo = () => {
  const { user } = useAuth();
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const { data: profile, refetch: refetchProfile } = useQuery({
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

  const detectLocation = async () => {
    if (!user?.id) return;
    
    setIsDetectingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();
      
      const address = data.display_name || `${latitude}, ${longitude}`;

      const { error } = await supabase
        .from('profiles')
        .update({
          latitude,
          longitude,
          address_text: address,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refetchProfile();
      
      toast({
        title: 'Lokasi Terdeteksi',
        description: 'Lokasi Anda berhasil diperbarui',
      });
    } catch (error) {
      console.error('Error detecting location:', error);
      toast({
        title: 'Error',
        description: 'Gagal mendeteksi lokasi. Pastikan GPS aktif.',
        variant: 'destructive'
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mb-8">
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
            
            {/* Desktop View */}
            <div className="hidden md:block p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg">
                    <Truck className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Informasi Pengiriman
                    </h3>
                    <div className="flex items-center space-x-2 text-gray-600 mb-3">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <p className="text-lg">
                        {profile?.address_text || profile?.address || 'Alamat belum diatur'}
                      </p>
                    </div>
                    {profile?.location_updated_at && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Diperbarui: {new Date(profile.location_updated_at).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="bg-green-100 p-3 rounded-full mb-2">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Pengiriman Aman</p>
                  </div>
                  <Button
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {isDetectingLocation ? (
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Navigation className="h-5 w-5 mr-2" />
                    )}
                    {isDetectingLocation ? 'Mendeteksi...' : 'Deteksi Lokasi'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl shadow-lg">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Pengiriman
                    </h3>
                    <p className="text-sm text-gray-600 truncate max-w-[150px]">
                      {profile?.address_text || profile?.address || 'Alamat belum diatur'}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={detectLocation}
                  disabled={isDetectingLocation}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg shadow-lg"
                >
                  {isDetectingLocation ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedShippingInfo;
