
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { MapPin, Target, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import LocationPermissionModal from './LocationPermissionModal';
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

interface LocationPickerProps {
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
}

interface MapEventsProps {
  onLocationClick: (lat: number, lng: number) => void;
}

const MapEvents: React.FC<MapEventsProps> = ({ onLocationClick }) => {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [position, setPosition] = useState<[number, number]>([- 6.2088, 106.8456]); // Default to Jakarta
  const [address, setAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const mapRef = useRef<any>(null);

  // Update user location mutation
  const updateLocation = useMutation({
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
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

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

    setShowPermissionModal(true);
  };

  const handleLocationPermissionAllow = () => {
    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        
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
        
        // Pan map to current location
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 15);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        toast({
          title: 'Error',
          description: 'Gagal mendapatkan lokasi',
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

  const handleLocationPermissionDeny = () => {
    toast({
      title: 'Info',
      description: 'Anda dapat memilih lokasi secara manual di peta',
    });
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
      updateLocation.mutate({
        lat: position[0],
        lng: position[1],
        addressText: address
      });
      
      if (onLocationSelect) {
        onLocationSelect(position[0], position[1], address);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Pilih Lokasi
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Pilih Lokasi Anda
            </DialogTitle>
            <DialogDescription>
              Klik pada peta untuk memilih lokasi atau gunakan tombol untuk mendapatkan lokasi saat ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                {isGettingLocation ? 'Mendapatkan Lokasi...' : 'Lokasi Saat Ini'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Alamat akan muncul saat Anda memilih lokasi di peta"
              />
            </div>

            <div className="h-80 w-full rounded-lg overflow-hidden border">
              <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position} icon={customIcon} />
                <MapEvents onLocationClick={handleMapClick} />
              </MapContainer>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Koordinat:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSaveLocation}
              disabled={!position || !address || updateLocation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {updateLocation.isPending ? 'Menyimpan...' : 'Simpan Lokasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LocationPermissionModal
        open={showPermissionModal}
        onOpenChange={setShowPermissionModal}
        onAllow={handleLocationPermissionAllow}
        onDeny={handleLocationPermissionDeny}
      />
    </>
  );
};

export default LocationPicker;
