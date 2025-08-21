
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchProductCardProps {
  product: any;
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

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    return imageUrl;
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-300">
      <CardContent className="p-3">
        <div className="relative mb-2">
          <img
            src={getImageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-24 object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
          />
          {product.current_stock <= product.min_stock && (
            <Badge variant="destructive" className="absolute top-1 right-1 text-xs">
              Terbatas
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          
          {product.categories && (
            <Badge variant="outline" className="text-xs">
              {product.categories.name}
            </Badge>
          )}
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-blue-600">
              {formatPrice(product.selling_price)}
            </p>
            <p className="text-xs text-gray-500">
              Stok: {product.current_stock}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2"
            onClick={() => navigate(`/product/${product.id}`)}
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
