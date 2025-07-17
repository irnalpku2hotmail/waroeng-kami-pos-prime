
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMarkerProps {
  position: [number, number] | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ position, onLocationSelect }: LocationMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setMarkerPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  return markerPosition === null ? null : (
    <Marker position={markerPosition}>
      <Popup>
        <div>
          <h3 className="font-bold">Lokasi Dipilih</h3>
          <p>Lat: {markerPosition[0].toFixed(6)}</p>
          <p>Lng: {markerPosition[1].toFixed(6)}</p>
        </div>
      </Popup>
    </Marker>
  );
}

const InteractiveLocationPicker = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addressText, setAddressText] = useState<string>('');

  // Load user's current location from profile
  useEffect(() => {
    if (user) {
      loadUserLocation();
    }
  }, [user]);

  const loadUserLocation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('latitude, longitude, address_text')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.latitude && data?.longitude) {
        setUserLocation([data.latitude, data.longitude]);
        setAddressText(data.address_text || '');
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  };

  const detectCurrentLocation = () => {
    setIsDetecting(true);
    
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation tidak didukung',
        description: 'Browser Anda tidak mendukung fitur geolocation',
        variant: 'destructive',
      });
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        
        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude}, ${longitude}`;
          setAddressText(address);
        } catch (error) {
          console.error('Error getting address:', error);
          setAddressText(`${latitude}, ${longitude}`);
        }
        
        setIsDetecting(false);
        toast({
          title: 'Lokasi berhasil dideteksi',
          description: 'Klik "Simpan Lokasi" untuk menyimpan'
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Gagal mendapatkan lokasi',
          description: 'Tidak dapat mengakses lokasi Anda',
          variant: 'destructive',
        });
        setIsDetecting(false);
      }
    );
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setUserLocation([lat, lng]);
    
    // Get address for selected location
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const address = data.display_name || `${lat}, ${lng}`;
      setAddressText(address);
    } catch (error) {
      console.error('Error getting address:', error);
      setAddressText(`${lat}, ${lng}`);
    }
  };

  const saveLocation = async () => {
    if (!user || !userLocation) return;

    setIsSaving(true);
    try {
      const [latitude, longitude] = userLocation;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude,
          longitude,
          address_text: addressText,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Lokasi berhasil disimpan',
        description: addressText
      });
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: 'Gagal menyimpan lokasi',
        description: 'Terjadi kesalahan saat menyimpan lokasi',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const defaultCenter: [number, number] = userLocation || [-6.2088, 106.8456]; // Jakarta as default

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Silakan login untuk menggunakan fitur lokasi</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Location Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lokasi Pengiriman
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userLocation ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-1" />
                <div className="flex-1">
                  <p className="font-medium">{addressText}</p>
                  <div className="text-sm text-gray-600 mt-1">
                    <span>Lat: {userLocation[0].toFixed(6)}, Lng: {userLocation[1].toFixed(6)}</span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700">
                  Tersimpan
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={detectCurrentLocation}
                  disabled={isDetecting}
                  variant="outline"
                  size="sm"
                >
                  {isDetecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  Deteksi Ulang
                </Button>
                <Button 
                  onClick={saveLocation}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Simpan Lokasi
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-4">Belum ada lokasi yang disimpan</p>
              <Button 
                onClick={detectCurrentLocation}
                disabled={isDetecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isDetecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Deteksi Lokasi Saat Ini
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Lokasi di Peta</CardTitle>
          <p className="text-sm text-gray-600">Klik pada peta untuk memilih lokasi pengiriman</p>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full rounded-lg overflow-hidden">
            <MapContainer
              center={defaultCenter}
              zoom={userLocation ? 15 : 11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker
                position={userLocation}
                onLocationSelect={handleLocationSelect}
              />
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveLocationPicker;
