
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import FrontendHero from '@/components/frontend/FrontendHero';
import FrontendCategoriesSlider from '@/components/frontend/FrontendCategoriesSlider';
import FrontendFooter from '@/components/frontend/FrontendFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Truck } from 'lucide-react';

const Frontend = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addToCart, setShippingCost } = useCart();

  // Fetch store settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      return settingsMap;
    }
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['frontend-products', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .eq('is_active', true)
        .gt('current_stock', 0);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch carousel images
  const { data: carouselImages = [] } = useQuery({
    queryKey: ['frontend-carousel'],
    queryFn: async () => {
      const frontendSettings = settings?.frontend_settings;
      if (frontendSettings && typeof frontendSettings === 'object' && 'carousel_images' in frontendSettings) {
        return (frontendSettings as any).carousel_images || [];
      }
      return [];
    },
    enabled: !!settings
  });

  const storeInfo = settings?.store_info || {};
  const codSettings = settings?.cod_settings;

  // Sync COD settings with cart
  useEffect(() => {
    if (codSettings && setShippingCost) {
      const deliveryFee = typeof codSettings === 'object' && codSettings !== null && 'delivery_fee' in codSettings 
        ? (codSettings as any).delivery_fee 
        : 10000;
      setShippingCost(deliveryFee);
    }
  }, [codSettings, setShippingCost]);

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      product: product,
      quantity: 1,
      price: product.selling_price
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FrontendNavbar
        storeName={storeInfo.name || 'Toko Online'}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <FrontendHero
        storeName={storeInfo.name || 'Toko Online'}
        storeDescription={storeInfo.description}
        carouselImages={carouselImages}
      />

      <FrontendCategoriesSlider
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-3">
                <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-blue-600">
                      Rp {product.selling_price?.toLocaleString('id-ID')}
                    </div>
                    {codSettings?.is_active && (
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        <Truck className="h-3 w-3 mr-1" />
                        COD
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Stok: {product.current_stock} {product.units?.abbreviation || 'pcs'}
                  </div>

                  <Button
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => handleAddToCart(product)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm || selectedCategory ? 'Tidak ada produk yang ditemukan' : 'Belum ada produk tersedia'}
            </div>
          </div>
        )}
      </div>

      <FrontendFooter />
    </div>
  );
};

export default Frontend;
