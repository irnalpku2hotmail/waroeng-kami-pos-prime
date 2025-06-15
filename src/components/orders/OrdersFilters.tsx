
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OrdersFiltersProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

const OrdersFilters = ({ searchTerm, statusFilter, onSearchChange, onStatusChange }: OrdersFiltersProps) => {
  return (
    <div className="flex gap-4">
      <Input
        placeholder="Cari nomor order atau nama customer..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="pending">Menunggu</SelectItem>
          <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
          <SelectItem value="preparing">Disiapkan</SelectItem>
          <SelectItem value="shipping">Dikirim</SelectItem>
          <SelectItem value="delivered">Selesai</SelectItem>
          <SelectItem value="cancelled">Dibatalkan</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default OrdersFilters;
