
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecureLocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  currentLocation?: { latitude: number; longitude: number; address?: string };
  className?: string;
}

const SecureLocationPicker = ({ onLocationSelect, currentLocation, className }: SecureLocationPickerProps) => {
  const [address, setAddress] = useState(currentLocation?.address || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const geocodeAddress = async (addressToGeocode: string) => {
    if (!addressToGeocode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an address',
        variant: 'destructive',
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { address: addressToGeocode }
      });

      if (error) {
        console.error('Geocoding error:', error);
        toast({
          title: 'Error',
          description: 'Failed to find location. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (data.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      onLocationSelect({
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.formatted_address
      });

      setAddress(data.formatted_address);

      toast({
        title: 'Success',
        description: 'Location found successfully',
      });

    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: 'Error',
        description: 'Failed to find location. Please check your internet connection.',
        variant: 'destructive',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by this browser',
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const { data, error } = await supabase.functions.invoke('geocode', {
            body: { address: `${latitude},${longitude}` }
          });

          const formattedAddress = data?.formatted_address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          onLocationSelect({
            latitude,
            longitude,
            address: formattedAddress
          });

          setAddress(formattedAddress);

          toast({
            title: 'Success',
            description: 'Current location detected',
          });

        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Still use the coordinates even if reverse geocoding fails
          const coordinateAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          onLocationSelect({
            latitude,
            longitude,
            address: coordinateAddress
          });
          setAddress(coordinateAddress);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get current location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        toast({
          title: 'Location Error',
          description: errorMessage,
          variant: 'destructive',
        });
        
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter address or location..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                geocodeAddress(address);
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => geocodeAddress(address)}
            disabled={isGeocoding}
            className="px-3"
          >
            {isGeocoding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="w-full"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Getting location...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Use Current Location
            </>
          )}
        </Button>

        {currentLocation && (
          <div className="text-sm text-muted-foreground">
            <p>Current: {currentLocation.address || `${currentLocation.latitude}, ${currentLocation.longitude}`}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecureLocationPicker;
