
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Navigation, RefreshCw, Truck, Clock, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const EnhancedShippingInfo = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings data for shipping info
  const { data: settings } = useQuery({
    queryKey: ['shipping-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['cod_settings', 'shipping_info']);
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  const shippingInfo = settings?.shipping_info || {};
  const codSettings = settings?.cod_settings || {};

  // Check if user has stored location in profile
  useEffect(() => {
    const checkProfileLocation = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('latitude, longitude, address_text, location_updated_at')
          .eq('id', user.id)
          .single();
        
        if (data && data.latitude && data.longitude) {
          setUserLocation({
            latitude: data.latitude,
            longitude: data.longitude
          });
          setLocationAddress(data.address_text || null);
        }
      }
    };
    
    checkProfileLocation();
  }, [user]);

  const detectLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          // Get address from coordinates using Nominatim
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const address = data.display_name || 'Lokasi terdeteksi';
            setLocationAddress(address);
            
            // Save location to user profile if logged in
            if (user) {
              await supabase
                .from('profiles')
                .update({
                  latitude,
                  longitude,
                  address_text: address,
                  location_updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            }
            
            toast({
              title: 'Lokasi Berhasil Diperbarui',
              description: 'Lokasi pengiriman Anda telah diperbarui'
            });
            
            setIsLoading(false);
          } catch (err) {
            console.error('Error getting address:', err);
            setLocationAddress('Lokasi terdeteksi, alamat tidak tersedia');
            setIsLoading(false);
          }
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Tidak dapat mendeteksi lokasi. Pastikan izin lokasi diaktifkan.');
          setIsLoading(false);
        }
      );
    } else {
      setError('Browser Anda tidak mendukung geolocation.');
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      {/* Enhanced Location Detection */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 shadow-lg border border-blue-100">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Location Section with Beautiful Design */}
          <div className="flex-1 bg-white/80 rounded-2xl p-6 backdrop-blur-sm shadow-md border border-white/50">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                  <MapPin className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  Lokasi Pengiriman
                  {locationAddress && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      Aktif
                    </span>
                  )}
                </h2>
                
                {locationAddress ? (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-xl border">
                      📍 {locationAddress}
                    </p>
                    <Button 
                      onClick={detectLocation}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Memperbarui...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          Perbarui Lokasi
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Deteksi lokasi Anda untuk informasi pengiriman yang lebih akurat dan estimasi waktu yang tepat.
                    </p>
                    <Button 
                      onClick={detectLocation}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Mendeteksi...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          Deteksi Lokasi
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Shipping Features with Beautiful Icons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 lg:w-80 gap-4">
            {/* Fast Delivery */}
            <div className="bg-white/80 rounded-2xl p-4 backdrop-blur-sm shadow-md border border-white/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl shadow-lg">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Pengiriman Cepat</h3>
                  <p className="text-xs text-gray-600 mt-1">Sampai dalam 1-3 hari kerja</p>
                </div>
              </div>
            </div>
            
            {/* Free Shipping */}
            <div className="bg-white/80 rounded-2xl p-4 backdrop-blur-sm shadow-md border border-white/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-purple-400 to-violet-500 p-3 rounded-xl shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Gratis Ongkir</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Min. {codSettings.free_shipping_min ? `Rp${codSettings.free_shipping_min.toLocaleString()}` : 'Rp100.000'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Cash on Delivery */}
            <div className="bg-white/80 rounded-2xl p-4 backdrop-blur-sm shadow-md border border-white/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-3 rounded-xl shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">Bayar di Tempat</h3>
                  <p className="text-xs text-gray-600 mt-1">COD tersedia semua area</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedShippingInfo;
