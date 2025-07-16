
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Star, Search, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import LocationPermissionModal from './LocationPermissionModal';

interface UserLocation {
  id: string;
  address_text: string;
  latitude: number;
  longitude: number;
  location_updated_at: string;
}

const LocationPicker = () => {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Fetch user locations
  const { data: locations = [], isLoading, refetch } = useQuery({
    queryKey: ['user-locations'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, address_text, latitude, longitude, location_updated_at')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('location_updated_at', { ascending: false });

      if (error) throw error;
      return data as UserLocation[];
    },
    enabled: !!user
  });

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation tidak didukung',
        description: 'Browser Anda tidak mendukung fitur geolocation',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
          );
          const data = await response.json();
          const address = data.results[0]?.formatted || `${latitude}, ${longitude}`;

          // Update user's location in database
          if (user) {
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

            toast({
              title: 'Lokasi berhasil diperbarui',
              description: address
            });

            refetch();
          }
        } catch (error) {
          console.error('Error updating location:', error);
          toast({
            title: 'Gagal memperbarui lokasi',
            description: 'Terjadi kesalahan saat menyimpan lokasi',
            variant: 'destructive',
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: 'Gagal mendapatkan lokasi',
          description: 'Tidak dapat mengakses lokasi Anda',
          variant: 'destructive',
        });
      }
    );
  };

  const handleLocationSelect = (location: UserLocation) => {
    setSelectedLocation(location);
    toast({
      title: 'Lokasi dipilih',
      description: location.address_text
    });
  };

  const filteredLocations = locations.filter(location =>
    location.address_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Current Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Lokasi Saat Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedLocation ? (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-600 mt-1" />
              <div className="flex-1">
                <p className="font-medium">{selectedLocation.address_text}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Diperbarui {new Date(selectedLocation.location_updated_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">
                Aktif
              </Badge>
            </div>
          ) : (
            <div className="text-center py-4">
              <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-4">Belum ada lokasi yang dipilih</p>
              <Button 
                onClick={() => setShowLocationModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Gunakan Lokasi Saat Ini
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline"
          onClick={() => setShowLocationModal(true)}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Lokasi Baru
        </Button>
      </div>

      {/* Saved Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Alamat Tersimpan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">
                {searchTerm ? 'Tidak ada alamat yang sesuai' : 'Belum ada alamat tersimpan'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedLocation?.id === location.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleLocationSelect(location)}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">{location.address_text}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(location.location_updated_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                    {selectedLocation?.id === location.id && (
                      <Badge className="bg-blue-100 text-blue-700">
                        Dipilih
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Permission Modal */}
      <LocationPermissionModal 
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
      />
    </div>
  );
};

export default LocationPicker;
