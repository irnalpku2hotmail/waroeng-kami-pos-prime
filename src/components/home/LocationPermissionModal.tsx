
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LocationPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = () => {
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation tidak didukung',
        description: 'Browser Anda tidak mendukung fitur geolocation',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location obtained:', { latitude, longitude });
        
        toast({
          title: 'Lokasi berhasil dideteksi',
          description: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
        });
        
        setIsLoading(false);
        onOpenChange(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        let errorMessage = 'Tidak dapat mengakses lokasi';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Izin lokasi ditolak oleh pengguna';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            errorMessage = 'Permintaan lokasi timeout';
            break;
        }
        
        toast({
          title: 'Gagal mendapatkan lokasi',
          description: errorMessage,
          variant: 'destructive',
        });
        
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Izin Akses Lokasi
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-600 mb-4">
            Untuk memberikan pengalaman berbelanja yang lebih baik, kami memerlukan akses ke lokasi Anda untuk:
          </p>
          
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 mb-6">
            <li>Menampilkan produk yang tersedia di area Anda</li>
            <li>Menghitung ongkos kirim yang akurat</li>
            <li>Memberikan rekomendasi toko terdekat</li>
          </ul>
          
          <div className="flex gap-3">
            <Button
              onClick={requestLocation}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Meminta Izin...' : 'Izinkan Akses Lokasi'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Tidak Sekarang
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPermissionModal;
