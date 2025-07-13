
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Navigation, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface UserLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  province: string;
  country: string;
  postal_code: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const UserLocations = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['user-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_locations')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).filter(location => 
        location.latitude && location.longitude
      ) as UserLocation[];
    },
  });

  const { data: locationStats } = useQuery({
    queryKey: ['location-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_locations')
        .select('city, province')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      const cities = [...new Set(data.map(loc => loc.city).filter(Boolean))];
      const provinces = [...new Set(data.map(loc => loc.province).filter(Boolean))];

      return {
        totalLocations: data.length,
        uniqueCities: cities.length,
        uniqueProvinces: provinces.length,
      };
    },
  });

  const filteredLocations = locations.filter(location =>
    location.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.province?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Lokasi Pengguna</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <MapPin className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Lokasi</p>
              <p className="text-2xl font-bold">{locationStats?.totalLocations || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Navigation className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Kota Unik</p>
              <p className="text-2xl font-bold">{locationStats?.uniqueCities || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Provinsi Unik</p>
              <p className="text-2xl font-bold">{locationStats?.uniqueProvinces || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari berdasarkan nama, alamat, atau kota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      {locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Peta Lokasi Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={[locations[0].latitude, locations[0].longitude]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredLocations.map((location) => (
                  <Marker
                    key={location.id}
                    position={[location.latitude, location.longitude]}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{location.profiles?.full_name || 'User'}</h3>
                        <p className="text-sm text-gray-600">{location.profiles?.email || ''}</p>
                        <p className="text-sm mt-1">{location.address}</p>
                        <p className="text-xs text-gray-500">
                          {location.city}, {location.province}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Lokasi ({filteredLocations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLocations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'Tidak ada lokasi yang sesuai dengan pencarian.' : 'Belum ada data lokasi pengguna.'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {location.profiles?.full_name || 'User'}
                      </h3>
                      <p className="text-sm text-gray-600">{location.profiles?.email || ''}</p>
                      <p className="text-sm text-gray-700 mt-1">{location.address}</p>
                      <p className="text-xs text-gray-500">
                        {location.city}, {location.province} {location.postal_code}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Koordinat: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {location.is_primary && (
                      <Badge variant="default">Utama</Badge>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(location.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLocations;
