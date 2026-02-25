
import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronLeft, ChevronRight, Star, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ProductGridSmallProps {
  searchTerm?: string;
  selectedCategory?: string;
  limit?: number;
  onAuthRequired?: () => void;
}

const ProductGridSmall = ({ searchTerm, selectedCategory, limit = 24, onAuthRequired }: ProductGridSmallProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
    const { data } = supabase.storage.from('product-images').getPublicUrl(imageUrl);
    return data.publicUrl;
  };

  const getOptimizedProductUrl = (imageUrl: string | null | undefined) => {
    const url = getImageUrl(imageUrl);
    if (url === '/placeholder.svg') return url;
    // Import dynamically to avoid circular deps
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=300&height=300&resize=contain&quality=80';
    }
    return url;
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onAuthRequired?.();
      toast({
        title: 'Login Diperlukan',
        description: 'Silakan login terlebih dahulu untuk berbelanja',
      });
      return;
    }
    if (product.current_stock <= 0) {
      toast({
        title: 'Stok habis',
        description: 'Produk ini sedang tidak tersedia',
        variant: 'destructive',
      });
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image: product.image_url,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: product.selling_price,
      total_price: product.selling_price,
    });
    toast({
      title: 'Ditambahkan ke keranjang',
      description: `${product.name} berhasil ditambahkan`,
    });
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollLeftFn = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRightFn = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [products]);

  // Split products into pairs for 2-row layout
  const productPairs: (typeof products)[] = [];
  for (let i = 0; i < products.length; i += 2) {
    productPairs.push(products.slice(i, i + 2));
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-36 space-y-2">
            <div className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-2"></div>
              <div className="h-3 bg-muted rounded mb-1"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
            <div className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-2"></div>
              <div className="h-3 bg-muted rounded mb-1"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  const renderProductCard = (product: any) => (
    <Card
      key={product.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group border-0 shadow-sm"
      onClick={() => {
        if (!user) {
          onAuthRequired?.();
          return;
        }
        navigate(`/product/${product.id}`);
      }}
    >
      <div className="relative aspect-square bg-gradient-to-br from-muted/30 to-muted/60 p-1">
        <img
          src={getOptimizedProductUrl(product.image_url)}
          alt={product.name}
          className="w-full h-full object-cover rounded"
          width={300}
          height={300}
          loading="lazy"
        />
        {product.current_stock <= product.min_stock && product.current_stock > 0 && (
          <Badge variant="destructive" className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 border-0">
            Terbatas
          </Badge>
        )}
        {product.current_stock <= 0 && (
          <Badge variant="destructive" className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 border-0">
            Habis
          </Badge>
        )}
        <Button
          size="icon"
          className="absolute bottom-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary shadow-lg"
          onClick={(e) => handleAddToCart(product, e)}
          disabled={product.current_stock <= 0}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-2">
        <p className="text-xs text-muted-foreground truncate">
          {product.categories?.name || 'Kategori'}
        </p>
        <h3 className="font-medium text-xs line-clamp-2 h-8 text-foreground">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-primary font-bold text-xs">
            {formatPrice(product.selling_price)}
          </span>
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 text-amber-400 fill-current" />
            <span className="text-[10px] text-muted-foreground">
              {product.current_stock > 0 ? product.current_stock : 0}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-[450px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-destructive" />
          <h2 className="font-bold text-base text-foreground">Produk Unggulan</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={scrollLeftFn}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={scrollRightFn}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {productPairs.map((pair, index) => (
          <div key={index} className="flex-shrink-0 w-36 sm:w-40 flex flex-col gap-3">
            {pair.map((product) => renderProductCard(product))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGridSmall;
