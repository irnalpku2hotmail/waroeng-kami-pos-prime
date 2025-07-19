
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

const BrandCarousel = () => {
  const { data: brands = [] } = useQuery({
    queryKey: ['active-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_brands')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  if (brands.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Brand Populer</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {brands.map((brand) => (
          <Card key={brand.id} className="flex-shrink-0 w-24 h-24">
            <CardContent className="p-3 flex items-center justify-center h-full">
              {brand.logo_url ? (
                <img 
                  src={brand.logo_url} 
                  alt={brand.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <Package className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-600 font-medium">
                    {brand.name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BrandCarousel;
