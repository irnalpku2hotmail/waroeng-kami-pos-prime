
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface LocationPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
  onDeny: () => void;
}

const LocationPermissionModal = ({ open, onOpenChange, onAllow, onDeny }: LocationPermissionModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Izin Akses Lokasi
          </DialogTitle>
          <DialogDescription className="text-left">
            Kami ingin mengakses lokasi Anda untuk memberikan pengalaman berbelanja yang lebih baik, seperti:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Menampilkan estimasi waktu pengiriman yang akurat</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Mencari produk yang tersedia di area Anda</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Menghitung ongkos kirim dengan tepat</span>
            </li>
          </ul>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">
              Informasi lokasi Anda akan disimpan dengan aman dan tidak akan dibagikan kepada pihak ketiga tanpa persetujuan Anda.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={onAllow}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Izinkan
            </Button>
            <Button
              onClick={onDeny}
              variant="outline"
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
