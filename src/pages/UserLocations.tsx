
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Navigation, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const UserLocations = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // Fetch user profiles with location data
  const { data: profiles, refetch: refetchProfiles } = useQuery({
    queryKey: ['user-profiles-with-location'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      return data;
    }
  });

  // Fetch current user's location
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile'],
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

  // Auto-detect user location
  const detectLocation = () => {
    setIsUpdatingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Update location in database
          if (user?.id) {
            const { error } = await supabase
              .from('profiles')
              .update({
                latitude,
                longitude,
                location_updated_at: new Date().toISOString()
              })
              .eq('id', user.id);

            if (error) {
              toast({
                title: 'Error',
                description: 'Gagal menyimpan lokasi',
                variant: 'destructive'
              });
            } else {
              toast({
                title: 'Berhasil',
                description: 'Lokasi berhasil diperbarui'
              });
              refetchProfiles();
            }
          }
          
          setIsUpdatingLocation(false);
        },
        (error) => {
          toast({
            title: 'Error',
            description: 'Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.',
            variant: 'destructive'
          });
          setIsUpdatingLocation(false);
        }
      );
    } else {
      toast({
        title: 'Error',
        description: 'Geolocation tidak didukung oleh browser ini',
        variant: 'destructive'
      });
      setIsUpdatingLocation(false);
    }
  };

  // Set initial location from database
  useEffect(() => {
    if (currentUserProfile?.latitude && currentUserProfile?.longitude) {
      setUserLocation({
        lat: currentUserProfile.latitude,
        lng: currentUserProfile.longitude
      });
    }
  }, [currentUserProfile]);

  const totalUsersWithLocation = profiles?.length || 0;
  const defaultCenter = userLocation || { lat: -6.2088, lng: 106.8456 }; // Jakarta as default

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Lokasi Pengguna</h1>
          </div>
          <Button 
            onClick={detectLocation}
            disabled={isUpdatingLocation}
            className="flex items-center gap-2"
          >
            {isUpdatingLocation ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {isUpdatingLocation ? 'Memperbarui...' : 'Deteksi Lokasi'}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsersWithLocation}</div>
              <p className="text-xs text-muted-foreground">
                Pengguna yang memberikan izin lokasi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Lokasi</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userLocation ? (
                  <Badge variant="default" className="bg-green-500">Aktif</Badge>
                ) : (
                  <Badge variant="secondary">Tidak Aktif</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {userLocation ? 'Lokasi terdeteksi' : 'Lokasi belum terdeteksi'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Koordinat</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono">
                {userLocation ? (
                  <div>
                    <div>Lat: {userLocation.lat.toFixed(6)}</div>
                    <div>Lng: {userLocation.lng.toFixed(6)}</div>
                  </div>
                ) : (
                  <div className="text-gray-500">Belum ada data</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle>Peta Lokasi Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 w-full rounded-lg overflow-hidden">
              <MapContainer
                center={[defaultCenter.lat, defaultCenter.lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Current user marker */}
                {userLocation && (
                  <Marker position={[userLocation.lat, userLocation.lng]}>
                    <Popup>
                      <div>
                        <h3 className="font-bold">Lokasi Anda</h3>
                        <p>Lat: {userLocation.lat.toFixed(6)}</p>
                        <p>Lng: {userLocation.lng.toFixed(6)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Other users markers */}
                {profiles?.map((profile) => (
                  profile.latitude && profile.longitude && profile.id !== user?.id && (
                    <Marker
                      key={profile.id}
                      position={[profile.latitude, profile.longitude]}
                    >
                      <Popup>
                        <div>
                          <h3 className="font-bold">{String(profile.full_name || '')}</h3>
                          <p className="text-sm text-gray-600">{String(profile.email || '')}</p>
                          <p className="text-xs">
                            Diperbarui: {profile.location_updated_at ? 
                              new Date(profile.location_updated_at).toLocaleDateString('id-ID') : 
                              'Tidak diketahui'
                            }
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna dengan Lokasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profiles?.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{String(profile.full_name || '')}</h3>
                      <p className="text-sm text-gray-600">{String(profile.email || '')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono">
                      {profile.latitude?.toFixed(6)}, {profile.longitude?.toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {profile.location_updated_at ? 
                        new Date(profile.location_updated_at).toLocaleDateString('id-ID') : 
                        'Tidak diketahui'
                      }
                    </div>
                  </div>
                </div>
              ))}
              
              {(!profiles || profiles.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada pengguna yang memberikan izin lokasi
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserLocations;
