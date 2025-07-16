
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface LocationPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow?: () => void;
  onDeny?: () => void;
}

const LocationPermissionModal = ({ 
  open, 
  onOpenChange, 
  onAllow, 
  onDeny 
}: LocationPermissionModalProps) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleAllow = async () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      onDeny?.();
      onOpenChange(false);
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location granted:', position.coords);
        onAllow?.();
        onOpenChange(false);
        setIsGettingLocation(false);
      },
      (error) => {
        console.log('Location denied:', error);
        onDeny?.();
        onOpenChange(false);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  const handleDeny = () => {
    onDeny?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Izinkan Akses Lokasi
          </DialogTitle>
          <DialogDescription>
            Kami ingin menggunakan lokasi Anda untuk memberikan pengalaman yang lebih baik,
            seperti menampilkan toko terdekat dan estimasi pengiriman yang akurat.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDeny} disabled={isGettingLocation}>
            Tidak Sekarang
          </Button>
          <Button onClick={handleAllow} disabled={isGettingLocation}>
            {isGettingLocation ? 'Mendapatkan Lokasi...' : 'Izinkan Akses'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPermissionModal;
