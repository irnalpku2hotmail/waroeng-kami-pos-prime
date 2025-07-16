
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { MapPin, Target, Users, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
const customIcon = new Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationData {
  latitude: number;
  longitude: number;
  address_text: string;
}

const MapEvents: React.FC<{ onLocationClick: (lat: number, lng: number) => void }> = ({ onLocationClick }) => {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const UserLocation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [position, setPosition] = useState<[number, number]>([-6.2088, 106.8456]); // Default to Jakarta
  const [address, setAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Fetch user's current location
  const { data: userLocation } = useQuery({
    queryKey: ['user-location', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('latitude, longitude, address_text')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as LocationData;
    },
    enabled: !!user?.id
  });

  // Fetch total users with location permission
  const { data: locationStats } = useQuery({
    queryKey: ['location-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (error) throw error;
      return { totalUsersWithLocation: data.length };
    }
  });

  // Update user location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ lat, lng, addressText }: { lat: number; lng: number; addressText: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: lat,
          longitude: lng,
          address_text: addressText,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Lokasi berhasil disimpan'
      });
      queryClient.invalidateQueries({ queryKey: ['user-location'] });
      queryClient.invalidateQueries({ queryKey: ['location-stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Set initial position if user has saved location
  useEffect(() => {
    if (userLocation?.latitude && userLocation?.longitude) {
      setPosition([userLocation.latitude, userLocation.longitude]);
      setAddress(userLocation.address_text || '');
      setHasLocationPermission(true);
    }
  }, [userLocation]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Browser tidak mendukung geolocation',
        variant: 'destructive'
      });
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        setHasLocationPermission(true);
        
        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setAddress(data.display_name);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        setHasLocationPermission(false);
        toast({
          title: 'Error',
          description: 'Gagal mendapatkan lokasi. Pastikan Anda memberikan izin lokasi.',
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    
    // Reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const handleSaveLocation = () => {
    if (position && address) {
      updateLocationMutation.mutate({
        lat: position[0],
        lng: position[1],
        addressText: address
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Login Required</h3>
              <p className="text-gray-600">Anda perlu login untuk mengakses fitur lokasi</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              Lokasi Pengguna
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {locationStats?.totalUsersWithLocation || 0}
                </div>
                <div className="text-sm text-gray-600">Total Pengguna dengan Lokasi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {hasLocationPermission ? 'Aktif' : 'Tidak Aktif'}
                </div>
                <div className="text-sm text-gray-600">Status Izin Lokasi</div>
              </div>
              <div className="text-center">
                <Button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  {isGettingLocation ? 'Mendapatkan Lokasi...' : 'Deteksi Lokasi'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle>Peta Interaktif</CardTitle>
            <p className="text-sm text-gray-600">
              Klik pada peta untuk memilih lokasi atau gunakan tombol deteksi lokasi otomatis
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full rounded-lg overflow-hidden border mb-4">
              <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position} icon={customIcon} />
                <MapEvents onLocationClick={handleMapClick} />
              </MapContainer>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat akan muncul saat Anda memilih lokasi di peta"
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <strong>Latitude:</strong> {position[0].toFixed(6)}
                </div>
                <div>
                  <strong>Longitude:</strong> {position[1].toFixed(6)}
                </div>
              </div>

              <Button
                onClick={handleSaveLocation}
                disabled={!position || !address || updateLocationMutation.isPending}
                className="w-full"
              >
                {updateLocationMutation.isPending ? 'Menyimpan...' : 'Simpan Lokasi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserLocation;
