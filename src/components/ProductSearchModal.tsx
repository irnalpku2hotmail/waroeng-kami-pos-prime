
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';

interface ProductSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (product: any) => void;
  flashSaleId?: string;
}

const ProductSearchModal = ({ open, onOpenChange, onSelectProduct, flashSaleId }: ProductSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products with search
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['product-search', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .eq('is_active', true);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('name').limit(20);
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Fetch existing flash sale items to avoid duplicates
  const { data: existingItems = [] } = useQuery({
    queryKey: ['flash-sale-items', flashSaleId],
    queryFn: async () => {
      if (!flashSaleId) return [];
      const { data, error } = await supabase
        .from('flash_sale_items')
        .select('product_id')
        .eq('flash_sale_id', flashSaleId);
      if (error) throw error;
      return data;
    },
    enabled: open && !!flashSaleId
  });

  const existingProductIds = existingItems.map(item => item.product_id);

  const handleSelectProduct = (product: any) => {
    onSelectProduct(product);
    onOpenChange(false);
    setSearchTerm('');
  };

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Pilih Produk untuk Flash Sale</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari produk berdasarkan nama atau barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {searchTerm ? 'Tidak ada produk ditemukan' : 'Mulai ketik untuk mencari produk'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => {
                  const isAlreadyAdded = existingProductIds.includes(product.id);
                  const productImageUrl = getImageUrl(product.image_url);
                  
                  return (
                    <Card key={product.id} className={`cursor-pointer transition-colors ${isAlreadyAdded ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            {productImageUrl ? (
                              <img 
                                src={productImageUrl} 
                                alt={String(product.name)}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-medium text-sm mb-1">{String(product.name)}</h3>
                            <p className="text-sm text-gray-500 mb-1">
                              {String(product.categories?.name || 'Tanpa kategori')}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-blue-600">
                                Rp {product.selling_price?.toLocaleString('id-ID')}
                              </span>
                              <Badge variant="secondary">
                                Stok: {product.current_stock}
                              </Badge>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => handleSelectProduct(product)}
                            disabled={isAlreadyAdded}
                          >
                            {isAlreadyAdded ? 'Sudah ditambah' : 'Pilih'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSearchModal;
