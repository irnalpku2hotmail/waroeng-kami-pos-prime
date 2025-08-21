
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  image_url?: string;
  selling_price: number;
  current_stock: number;
  categories?: {
    name: string;
  };
}

interface SearchProductCardProps {
  product: Product;
}

const SearchProductCard = ({ product }: SearchProductCardProps) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleViewDetail = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          
          {product.categories && (
            <Badge variant="secondary" className="text-xs">
              {product.categories.name}
            </Badge>
          )}
          
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-600 text-sm">
              {formatPrice(product.selling_price)}
            </span>
            <span className="text-xs text-gray-500">
              Stok: {product.current_stock}
            </span>
          </div>
          
          <Button
            onClick={handleViewDetail}
            className="w-full h-8 text-xs"
            size="sm"
          >
            <Eye className="h-3 w-3 mr-1" />
            Detail
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchProductCard;
