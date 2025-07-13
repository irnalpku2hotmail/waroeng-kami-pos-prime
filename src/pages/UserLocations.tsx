
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Users, CheckCircle, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  created_at: string;
  updated_at: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

const UserLocations = () => {
  const [searchUser, setSearchUser] = useState<string>('');

  // Fetch all users with profiles for search
  const { data: users = [] } = useQuery({
    queryKey: ['users-with-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch user locations with profile data based on search
  const { data: locations = [] } = useQuery({
    queryKey: ['user-locations', searchUser],
    queryFn: async () => {
      let query = supabase
        .from('user_locations')
        .select('*');
      
      // If there's a search term, filter by user
      if (searchUser) {
        const filteredUsers = users.filter(user => 
          user.full_name.toLowerCase().includes(searchUser.toLowerCase()) ||
          user.email.toLowerCase().includes(searchUser.toLowerCase())
        );
        
        if (filteredUsers.length > 0) {
          const userIds = filteredUsers.map(user => user.id);
          query = query.in('user_id', userIds);
        } else {
          return [];
        }
      }
      
      const { data: locationData, error } = await query;
      if (error) throw error;
      
      // Get user profiles for the locations
      if (locationData && locationData.length > 0) {
        const userIds = locationData.map(loc => loc.user_id).filter(Boolean);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
          
        if (profileError) throw profileError;
        
        // Combine location data with profile data
        const locationsWithProfiles: UserLocation[] = locationData.map(location => {
          const profile = profileData?.find(p => p.id === location.user_id);
          return {
            ...location,
            user_profile: profile ? {
              full_name: profile.full_name,
              email: profile.email
            } : undefined
          };
        });
        
        return locationsWithProfiles;
      }
      
      return [];
    },
    enabled: !!users.length
  });

  // Calculate statistics
  const totalUsers = users.length;
  const usersWithLocation = new Set(locations.map(loc => loc.user_id)).size;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">User Locations</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users with Location</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{usersWithLocation}</div>
              <p className="text-xs text-muted-foreground">
                Granted location permission
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permission Rate</CardTitle>
              <MapPin className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalUsers > 0 ? Math.round((usersWithLocation / totalUsers) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Users sharing location
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Map with Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Interactive Map
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96 rounded-lg border overflow-hidden">
              <MapContainer
                center={[-6.2088, 106.8456]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locations.map((location) => (
                  location.latitude && location.longitude && (
                    <Marker 
                      key={location.id}
                      position={[Number(location.latitude), Number(location.longitude)]}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold">{location.user_profile?.full_name || 'Unknown User'}</h3>
                          <p className="text-sm text-gray-600">{location.user_profile?.email || ''}</p>
                          {location.address && <p className="text-sm mt-1">{location.address}</p>}
                          <p className="text-xs text-gray-500 mt-1">
                            Updated: {new Date(location.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {locations.length} location(s) found.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserLocations;
