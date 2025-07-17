
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Clock, Navigation, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const EnhancedShippingInfo = () => {
  const { user, profile } = useAuth();
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        // Reverse geocoding untuk mendapatkan alamat
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          setAddress(data.display_name || 'Lokasi tidak ditemukan');
        } catch (error) {
          console.error('Error getting address:', error);
          setAddress('Gagal mendapatkan alamat');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLoading(false);
        alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
      }
    );
  };

  if (isMobile) {
    return (
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-full">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Pengiriman</h3>
              <p className="text-sm text-gray-600">Gratis ongkir hari ini</p>
            </div>
          </div>
          <Button 
            onClick={detectLocation}
            disabled={loading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {location && (
          <div className="mt-3 p-2 bg-white rounded-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <p className="text-sm text-gray-700 truncate">{address}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Informasi Pengiriman */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500 rounded-full">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Pengiriman Gratis</h3>
                <p className="text-gray-600">Untuk pembelian minimal Rp 100.000</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Estimasi 1-2 hari kerja</span>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <span className="animate-pulse">●</span> Tersedia untuk wilayah Anda
            </Badge>
          </div>

          {/* Deteksi Lokasi */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500 rounded-full">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Lokasi Anda</h3>
                <p className="text-gray-600">Deteksi otomatis untuk layanan terbaik</p>
              </div>
            </div>
            <Button 
              onClick={detectLocation}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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

          {/* Status Lokasi */}
          <div className="space-y-4">
            {location ? (
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Lokasi Terdeteksi</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{address}</p>
                <div className="mt-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Siap untuk pengiriman</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Klik tombol deteksi untuk mengetahui lokasi Anda</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedShippingInfo;
