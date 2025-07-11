
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Users, CheckCircle } from 'lucide-react';
import Layout from '@/components/Layout';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const UserLocations = () => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  // Fetch all users with profiles
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

  // Fetch user locations
  const { data: locations = [] } = useQuery({
    queryKey: ['user-locations', selectedUser],
    queryFn: async () => {
      let query = supabase
        .from('user_locations')
        .select(`
          *,
          profiles!inner(full_name, email)
        `);
      
      if (selectedUser) {
        query = query.eq('user_id', selectedUser);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate statistics
  const totalUsers = users.length;
  const usersWithLocation = new Set(locations.map(loc => loc.user_id)).size;

  // Initialize Google Maps
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      window.initMap = initializeMap;
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: -6.2088, lng: 106.8456 }, // Jakarta center
        zoom: 10,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);
    };

    loadGoogleMaps();
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: any[] = [];

    // Add new markers
    locations.forEach(location => {
      if (location.latitude && location.longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) },
          map: map,
          title: location.profiles?.full_name || 'Unknown User',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#3B82F6"/>
                <circle cx="16" cy="16" r="12" fill="white"/>
                <circle cx="16" cy="16" r="8" fill="#3B82F6"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">${location.profiles?.full_name || 'Unknown User'}</h3>
              <p class="text-sm text-gray-600">${location.profiles?.email || ''}</p>
              ${location.address ? `<p class="text-sm mt-1">${location.address}</p>` : ''}
              <p class="text-xs text-gray-500 mt-1">
                Updated: ${new Date(location.updated_at).toLocaleDateString()}
              </p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        newMarkers.push(marker);
      }
    });

    setMarkers(newMarkers);

    // Adjust map bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);
    }
  }, [map, locations]);

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

        {/* User Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by User</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select a user or view all" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Interactive Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border"
              style={{ minHeight: '400px' }}
            />
            <p className="text-sm text-gray-500 mt-2">
              Click on markers to view user details. {locations.length} location(s) found.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserLocations;
