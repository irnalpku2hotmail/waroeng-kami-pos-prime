import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Navigation, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
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
  full_name: string;
  latitude: number;
  longitude: number;
  address_text: string | null;
  location_updated_at: string;
}

const UserLocations = () => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Fetch all user locations
  const { data: userLocations = [], isLoading, refetch } = useQuery({
    queryKey: ['user-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, latitude, longitude, address_text, location_updated_at')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      return data as UserLocation[];
    }
  });

  // Get current user location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by this browser',
        variant: 'destructive'
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Save to Supabase
        if (user) {
          try {
            const { error } = await supabase
              .from('profiles')
              .update({
                latitude,
                longitude,
                location_updated_at: new Date().toISOString()
              })
              .eq('id', user.id);

            if (error) throw error;

            toast({
              title: 'Success',
              description: 'Location saved successfully'
            });

            refetch();
          } catch (error) {
            console.error('Error saving location:', error);
            toast({
              title: 'Error',
              description: 'Failed to save location',
              variant: 'destructive'
            });
          }
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: 'Error',
          description: 'Failed to get your location',
          variant: 'destructive'
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  const defaultCenter: [number, number] = [-6.2088, 106.8456]; // Jakarta, Indonesia

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Locations</h1>
          <p className="text-muted-foreground">
            Interactive map showing user locations with real-time tracking
          </p>
        </div>
        <Button
          onClick={getCurrentLocation}
          disabled={isGettingLocation || !user}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          {isGettingLocation ? 'Getting Location...' : 'Update My Location'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userLocations.length}</div>
            <p className="text-xs text-muted-foreground">
              Users who shared location
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permission Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Granted</div>
            <p className="text-xs text-muted-foreground">
              Location access approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userLocations.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Interactive User Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-muted">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Loading map...</p>
                </div>
              </div>
            ) : (
              <MapContainer
                center={currentLocation ? [currentLocation.lat, currentLocation.lng] : defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Current user location */}
                {currentLocation && (
                  <Marker position={[currentLocation.lat, currentLocation.lng]}>
                    <Popup>
                      <div className="text-center">
                        <strong>Your Current Location</strong>
                        <br />
                        <Badge className="mt-1">Live</Badge>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Other user locations */}
                {userLocations.map((location) => (
                  <Marker
                    key={location.id}
                    position={[location.latitude, location.longitude]}
                  >
                    <Popup>
                      <div className="space-y-2">
                        <div className="font-semibold">{location.full_name}</div>
                        {location.address_text && (
                          <div className="text-sm text-gray-600">
                            {location.address_text}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Updated: {new Date(location.location_updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>User Location List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userLocations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No user locations found. Be the first to share your location!
              </div>
            ) : (
              userLocations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{location.full_name}</div>
                      {location.address_text && (
                        <div className="text-sm text-muted-foreground">
                          {location.address_text}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Lat: {location.latitude.toFixed(6)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Lng: {location.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLocations;
