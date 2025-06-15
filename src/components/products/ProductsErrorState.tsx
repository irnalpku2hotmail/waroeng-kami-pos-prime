
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductsErrorStateProps {
  error: Error;
  onRetry: () => void;
}

const ProductsErrorState = ({ error, onRetry }: ProductsErrorStateProps) => {
  return (
    <div className="text-center py-8">
      <Package className="h-12 w-12 mx-auto text-red-400 mb-4" />
      <p className="text-red-500">Error memuat data: {error.message}</p>
      <Button 
        variant="outline" 
        onClick={onRetry}
        className="mt-4"
      >
        Coba Lagi
      </Button>
    </div>
  );
};

export default ProductsErrorState;
