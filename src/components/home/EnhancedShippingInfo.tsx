
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Truck, Clock, Shield, Zap, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const EnhancedShippingInfo = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

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
        } else {
          setShowLocationPrompt(true);
        }
      }
    };
    
    checkProfileLocation();
  }, [user]);

  const detectLocation = () => {
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
      {/* Location detection on mobile - Simplified version */}
      <div className="md:hidden mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                {locationAddress ? (
                  <>
                    <p className="font-medium text-sm text-gray-700">Lokasi Pengiriman</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{locationAddress}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-700">Deteksi lokasi untuk pengiriman</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={detectLocation}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              {isLoading ? 'Mendeteksi...' : locationAddress ? 'Perbarui' : 'Deteksi'}
            </button>
          </div>
          
          {error && (
            <p className="mt-2 text-red-500 text-xs">{error}</p>
          )}
        </div>
      </div>
      
      {/* Desktop version with full shipping info */}
      <div className="hidden md:block">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Location detection */}
            <div className="flex-1 bg-white/80 rounded-xl p-4 backdrop-blur-sm shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">Lokasi Pengiriman</h3>
                  {locationAddress ? (
                    <>
                      <p className="text-gray-600 mb-3 line-clamp-2">{locationAddress}</p>
                      <button 
                        onClick={detectLocation}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm"
                      >
                        {isLoading ? 'Mendeteksi...' : 'Perbarui Lokasi'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-3">Deteksi lokasi Anda untuk pengiriman lebih akurat</p>
                      <button 
                        onClick={detectLocation}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm"
                      >
                        {isLoading ? 'Mendeteksi...' : 'Deteksi Lokasi'}
                      </button>
                    </>
                  )}
                  
                  {error && (
                    <p className="mt-2 text-red-500 text-sm">{error}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Shipping Features */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
              {/* Fast Delivery */}
              <div className="bg-white/80 rounded-xl p-4 backdrop-blur-sm shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Pengiriman Cepat</h3>
                    <p className="text-xs text-gray-500 mt-1">Sampai dalam 1-3 hari kerja</p>
                  </div>
                </div>
              </div>
              
              {/* Free Shipping */}
              <div className="bg-white/80 rounded-xl p-4 backdrop-blur-sm shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Gratis Ongkir</h3>
                    <p className="text-xs text-gray-500 mt-1">Minimal pembelian {codSettings.free_shipping_min ? `Rp${codSettings.free_shipping_min.toLocaleString()}` : 'Rp100.000'}</p>
                  </div>
                </div>
              </div>
              
              {/* Cash on Delivery */}
              <div className="bg-white/80 rounded-xl p-4 backdrop-blur-sm shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Bayar di Tempat</h3>
                    <p className="text-xs text-gray-500 mt-1">COD tersedia untuk semua area</p>
                  </div>
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
