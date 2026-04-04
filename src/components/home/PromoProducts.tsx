import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface PromoProductsProps {
  onAuthRequired?: () => void;
}

const PromoProducts = ({ onAuthRequired }: PromoProductsProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['promo-products'],
    queryFn: async () => {
      // Fetch products with promo tags or high stock (likely promoted)
      const { data, error } = await supabase
        .from('products')
        .select(`*, categories(id, name), product_brands(id, name, logo_url)`)
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('current_stock', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []).map((p: any) => {
        const tags = p.tags || [];
        const hasPromo = tags.some((t: string) => ['promo', 'diskon', 'sale', 'hemat'].includes(t.toLowerCase()));
        const isBestseller = p.current_stock > 50;
        return { ...p, hasPromo, isBestseller };
      });
    }
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    const { data } = supabase.storage.from('product-images').getPublicUrl(imageUrl);
    return data.publicUrl;
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onAuthRequired?.(); return; }
    if (product.current_stock <= 0) return;
    addToCart({
      id: product.id, name: product.name, price: product.selling_price,
      quantity: 1, image: product.image_url, stock: product.current_stock,
      product_id: product.id, unit_price: product.selling_price, total_price: product.selling_price,
    });
    toast({ title: 'Ditambahkan', description: `${product.name} ke keranjang` });
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-5 w-40 mb-3" />
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'}`}>
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square rounded-lg mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-sm md:text-base text-foreground">Rekomendasi Untukmu</h2>
      </div>
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'}`}>
        {products.map((product: any) => (
          <div
            key={product.id}
            onClick={() => {
              if (!user) { onAuthRequired?.(); return; }
              navigate(`/product/${product.id}`);
            }}
            className="bg-card rounded-lg overflow-hidden border border-border/40 cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-accent/20">
              <img
                src={getImageUrl(product.image_url)}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Labels */}
              <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                {product.hasPromo && (
                  <Badge className="bg-destructive text-destructive-foreground text-[8px] px-1.5 py-0 h-4 font-bold">
                    PROMO
                  </Badge>
                )}
                {product.isBestseller && !product.hasPromo && (
                  <Badge className="bg-amber-500 text-white text-[8px] px-1.5 py-0 h-4 font-bold">
                    Terlaris
                  </Badge>
                )}
              </div>
              {product.current_stock <= product.min_stock && product.current_stock > 0 && (
                <Badge variant="destructive" className="absolute top-1 right-1 text-[8px] px-1 py-0 h-4">
                  Sisa {product.current_stock}
                </Badge>
              )}
              <Button
                size="icon"
                className="absolute bottom-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary shadow-md"
                onClick={(e) => handleAddToCart(product, e)}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Info */}
            <div className="p-2">
              <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-tight mb-1 min-h-[28px]">
                {product.name}
              </h3>
              <p className="text-primary font-bold text-xs">{formatPrice(product.selling_price)}</p>
              {product.categories?.name && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{product.categories.name}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromoProducts;
