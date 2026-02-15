
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ProductGridSmallProps {
  searchTerm?: string;
  selectedCategory?: string;
  limit?: number;
}

const ProductGridSmall = ({ searchTerm, selectedCategory, limit = 12 }: ProductGridSmallProps) => {
  const navigate = useNavigate();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-small', searchTerm, selectedCategory, limit],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          units(name, abbreviation)
        `)
        .eq('is_active', true)
        .order('name')
        .limit(limit);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

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
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...Array(12)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="w-full h-32 bg-gray-200 rounded-md mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {products.map((product) => (
        <Card 
          key={product.id} 
          className="group hover:shadow-md transition-shadow duration-300 cursor-pointer border-2 border-transparent hover:border-orange-400"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <CardContent className="p-3">
            <div className="relative mb-2">
              <img
                src={getImageUrl(product.image_url)}
                alt={product.name}
                className="w-full h-32 object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
              />
              {product.current_stock <= product.min_stock && (
                <Badge variant="destructive" className="absolute top-1 right-1 text-xs">
                  Terbatas
                </Badge>
              )}
              
              {/* View Detail Button */}
              <Button
                size="icon"
                className="absolute bottom-1 right-1 h-7 w-7 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${product.id}`);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              
              {product.categories && (
                <Badge variant="outline" className="text-xs">
                  {product.categories.name}
                </Badge>
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-primary">
                  {formatPrice(product.selling_price)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Stok: {product.current_stock}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGridSmall;
