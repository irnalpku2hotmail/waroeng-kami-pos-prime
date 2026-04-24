import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { TrendingUp, ShoppingCart, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingProductsProps {
  onAuthRequired?: () => void;
}

const TrendingProducts: React.FC<TrendingProductsProps> = ({ onAuthRequired }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const isMobile = useIsMobile();

  // 1. Get user's personal search history terms
  const { data: userSearchTerms } = useQuery({
    queryKey: ['user-search-terms', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('search_history')
        .select('search_term')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return [...new Set((data || []).map(d => d.search_term.toLowerCase()))];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // 2. Get global trending search terms from search_analytics
  const { data: trendingTerms } = useQuery({
    queryKey: ['trending-search-terms'],
    queryFn: async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('search_analytics')
        .select('search_query')
        .gte('created_at', oneDayAgo)
        .gt('results_count', 0)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!data?.length) return [];
      
      // Count frequency
      const freq: Record<string, number> = {};
      data.forEach(d => {
        const q = d.search_query.toLowerCase().trim();
        freq[q] = (freq[q] || 0) + 1;
      });
      
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([term]) => term);
    },
    staleTime: 10 * 60 * 1000,
  });

  // 3. Fetch products matching trending/user terms, fallback to bestsellers
  const { data: products, isLoading } = useQuery({
    queryKey: ['trending-products', userSearchTerms, trendingTerms],
    queryFn: async () => {
      // Combine user terms (priority) + global trending
      const allTerms = [
        ...(userSearchTerms || []),
        ...(trendingTerms || []),
      ].filter(Boolean);

      let matchedProducts: any[] = [];

      if (allTerms.length > 0) {
        // Search products matching top terms using ilike
        const uniqueTerms = [...new Set(allTerms)].slice(0, 5);
        const orFilter = uniqueTerms.map(t => `name.ilike.%${t}%,tags.cs.{${t}}`).join(',');
        
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .or(uniqueTerms.map(t => `name.ilike.%${t}%`).join(','))
          .order('current_stock', { ascending: false })
          .limit(20);
        
        matchedProducts = data || [];
      }

      // Fallback: bestsellers / high stock products
      if (matchedProducts.length < 6) {
        const { data: fallback } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('current_stock', { ascending: false })
          .limit(20);
        
        const existingIds = new Set(matchedProducts.map(p => p.id));
        const extra = (fallback || []).filter(p => !existingIds.has(p.id));
        matchedProducts = [...matchedProducts, ...extra].slice(0, 15);
      }

      return matchedProducts;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onAuthRequired?.();
      toast({ title: 'Login Diperlukan', description: 'Silakan login terlebih dahulu' });
      return;
    }
    if (product.current_stock <= 0) {
      toast({ title: 'Stok Habis', description: 'Produk ini sedang habis', variant: 'destructive' });
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      stock: product.current_stock,
      image: product.image_url,
    });
    toast({ title: 'Berhasil!', description: `${product.name} ditambahkan ke keranjang` });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 mb-3 px-3 md:px-0">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-3 px-3 md:px-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="flex-shrink-0 rounded-xl" style={{ width: isMobile ? 140 : 170, height: isMobile ? 200 : 230 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!products?.length) return null;

  return (
    <div className="py-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-3 md:px-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground">Sering Dicari</h2>
            {!isMobile && (
              <p className="text-xs text-muted-foreground">Banyak dicari hari ini</p>
            )}
          </div>
        </div>
        {isMobile && (
          <span className="text-[10px] text-muted-foreground">Banyak dicari hari ini</span>
        )}
      </div>

      {/* Product cards - horizontal scroll on mobile/tablet, grid on desktop */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 px-3 md:px-0 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible lg:pb-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.slice(0, 12).map((product: any) => (
          <div
            key={product.id}
            className="flex-shrink-0 lg:flex-shrink lg:w-auto group cursor-pointer"
            style={{ width: isMobile ? 140 : 170 }}
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5 active:scale-[0.97]">
              {/* Image */}
              <div className="aspect-[4/3] relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {/* Out of stock overlay */}
                {product.current_stock <= 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Badge variant="destructive" className="text-[10px]">Habis</Badge>
                  </div>
                )}
                {/* Trending badge */}
                <div className="absolute top-1 left-1">
                  <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    🔥 Trending
                  </span>
                </div>
                {/* Cart button */}
                {product.current_stock > 0 && (
                  <Button
                    size="icon"
                    className="absolute bottom-1 right-1 h-6 w-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow"
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    <ShoppingCart className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-1">
                  {product.name}
                </h3>
                <span className="text-xs font-bold text-primary">
                  {formatPrice(product.selling_price)}
                </span>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  Stok: {product.current_stock}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingProducts;
