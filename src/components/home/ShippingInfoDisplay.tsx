
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const ShippingInfoDisplay = () => {
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

      // Reverse geocoding to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();
      
      const address = data.display_name || `${latitude}, ${longitude}`;

      // Update profile with location
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
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Informasi Pengiriman
                </h3>
                <p className="text-sm text-gray-600">
                  {profile?.address_text || profile?.address || 'Alamat belum diatur'}
                </p>
                {profile?.location_updated_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Terakhir diperbarui: {new Date(profile.location_updated_at).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={detectLocation}
                disabled={isDetectingLocation}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isDetectingLocation ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                {isDetectingLocation ? 'Mendeteksi...' : 'Deteksi Lokasi'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingInfoDisplay;
