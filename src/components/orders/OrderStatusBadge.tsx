
import { Badge } from '@/components/ui/badge';

interface OrderStatusBadgeProps {
  status: string;
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const statusConfig = {
    pending: { label: 'Menunggu', variant: 'secondary' as const },
    confirmed: { label: 'Dikonfirmasi', variant: 'default' as const },
    preparing: { label: 'Disiapkan', variant: 'default' as const },
    shipping: { label: 'Dikirim', variant: 'default' as const },
    delivered: { label: 'Selesai', variant: 'default' as const },
    cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default OrderStatusBadge;
