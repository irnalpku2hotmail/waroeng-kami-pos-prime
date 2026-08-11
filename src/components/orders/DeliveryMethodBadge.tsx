import { Badge } from '@/components/ui/badge';
import { Store, Truck } from 'lucide-react';

interface DeliveryMethodBadgeProps {
  method?: string | null;
  className?: string;
}

const DeliveryMethodBadge = ({ method, className }: DeliveryMethodBadgeProps) => {
  const isPickup = String(method || 'COD').toUpperCase() === 'PICKUP';

  return (
    <Badge
      variant="outline"
      className={`gap-1 ${isPickup ? 'border-green-300 bg-green-50 text-green-700' : 'border-blue-300 bg-blue-50 text-blue-700'} ${className || ''}`}
    >
      {isPickup ? <Store className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
      {isPickup ? 'Ambil di Tempat' : 'COD'}
    </Badge>
  );
};

export default DeliveryMethodBadge;