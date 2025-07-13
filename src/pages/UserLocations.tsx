
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Search, MapPin, Users, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
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
  is_primary: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const UserLocations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>(null);

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
      return data as UserLocation[];
    },
  });

  const filteredLocations = locations.filter(location =>
    location.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validLocations = filteredLocations.filter(location => 
    location.latitude && location.longitude
  );

  const centerLat = validLocations.length > 0 
    ? validLocations.reduce((sum, loc) => sum + loc.latitude, 0) / validLocations.length
    : -6.2088; // Default to Jakarta

  const centerLng = validLocations.length > 0
    ? validLocations.reduce((sum, loc) => sum + loc.longitude, 0) / validLocations.length
    : 106.8456; // Default to Jakarta

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Lokasi Pengguna</h1>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lokasi</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{locations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengguna Unik</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(locations.map(loc => loc.user_id)).size}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lokasi Valid</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{validLocations.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Peta Lokasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden">
                <MapContainer
                  center={[centerLat, centerLng]}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {validLocations.map((location) => (
                    <Marker
                      key={location.id}
                      position={[location.latitude, location.longitude]}
                      eventHandlers={{
                        click: () => setSelectedLocation(location),
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold">{location.profiles?.full_name}</h3>
                          <p className="text-sm text-gray-600">{location.profiles?.email}</p>
                          <p className="text-sm mt-1">{location.address}</p>
                          <p className="text-sm">{location.city}, {location.province}</p>
                          {location.is_primary && (
                            <Badge className="mt-2" variant="secondary">Lokasi Utama</Badge>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Location List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Daftar Lokasi</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan nama atau alamat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredLocations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    {searchTerm ? 'Tidak ada lokasi yang ditemukan' : 'Belum ada data lokasi'}
                  </p>
                ) : (
                  filteredLocations.map((location) => (
                    <div
                      key={location.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedLocation?.id === location.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{location.profiles?.full_name}</h3>
                          <p className="text-sm text-gray-600">{location.profiles?.email}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <p className="text-sm text-gray-500">{location.address}</p>
                          </div>
                          <p className="text-xs text-gray-400">
                            {location.city}, {location.province}
                          </p>
                        </div>
                        {location.is_primary && (
                          <Badge variant="secondary" className="ml-2">
                            Utama
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UserLocations;
