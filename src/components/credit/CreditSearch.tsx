
import { Input } from '@/components/ui/input';

interface CreditSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const CreditSearch = ({ searchTerm, onSearchChange }: CreditSearchProps) => {
  return (
    <div className="flex gap-4">
      <Input
        placeholder="Cari nomor transaksi..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
    </div>
  );
};

export default CreditSearch;
