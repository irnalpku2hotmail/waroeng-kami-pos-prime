import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Sparkles, Star, Eye } from 'lucide-react';

const PersonalizedRecommendations = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch user's purchased products
  const { data: purchasedProducts = [] } = useQuery({
    queryKey: ['user-purchased-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profileData) return [];

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('customer_id', user.id);

      if (!transactions || transactions.length === 0) return [];

      const transactionIds = transactions.map(t => t.id);

      const { data: items } = await supabase
        .from('transaction_items')
        .select(`
          product_id,
          quantity,
          products:product_id (
            id, name, selling_price, image_url, current_stock,
            categories(name)
          )
        `)
        .in('transaction_id', transactionIds);

      if (!items) return [];

      const productMap = new Map();
      items.forEach((item: any) => {
        if (item.products) {
          const existing = productMap.get(item.product_id);
          if (existing) {
            existing.frequency += item.quantity;
          } else {
            productMap.set(item.product_id, {
              ...item.products,
              frequency: item.quantity,
              type: 'purchased'
            });
          }
        }
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);
    },
    enabled: !!user?.id
  });

  // Fetch user's searched products
  const { data: searchedProducts = [] } = useQuery({
    queryKey: ['user-searched-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: searches } = await supabase
        .from('search_history')
        .select('search_term')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!searches || searches.length === 0) return [];

      const uniqueTerms = [...new Set(searches.map(s => s.search_term))].slice(0, 5);

      const productPromises = uniqueTerms.map(term =>
        supabase
          .from('products')
          .select(`id, name, selling_price, image_url, current_stock, categories(name)`)
          .eq('is_active', true)
          .ilike('name', `%${term}%`)
          .limit(3)
      );

      const results = await Promise.all(productPromises);
      const products = results.flatMap(r => r.data || []);

      const uniqueProducts = products.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
      );

      return uniqueProducts.slice(0, 10).map(p => ({ ...p, type: 'searched' }));
    },
    enabled: !!user?.id
  });

  // Fetch popular products for guests
  const { data: popularProducts = [] } = useQuery({
    queryKey: ['popular-products-guest'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select(`id, name, selling_price, image_url, current_stock, categories(name)`)
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('created_at', { ascending: false })
        .limit(15);
      return (data || []).map(p => ({ ...p, type: 'popular' }));
    },
    enabled: !user
  });

  // Combine and deduplicate recommendations
  const recommendations = React.useMemo(() => {
    if (!user) return popularProducts;
    const allProducts = [...purchasedProducts, ...searchedProducts];
    const uniqueProducts = allProducts.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );
    return uniqueProducts.slice(0, 15);
  }, [purchasedProducts, searchedProducts, popularProducts, user]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollLeftFn = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRightFn = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [recommendations]);

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    const { data } = supabase.storage.from('product-images').getPublicUrl(imageUrl);
    return data.publicUrl;
  };

  // Cart disabled in catalog mode

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  if (recommendations.length === 0) return null;

  const userName = user ? (profile?.full_name?.split(' ')[0] || 'Anda') : 'Anda';

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="font-bold text-base text-foreground">
            Rekomendasi untuk {userName}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={scrollLeftFn} disabled={!canScrollLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={scrollRightFn} disabled={!canScrollRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {recommendations.map((product) => (
          <Card
            key={product.id}
            className="flex-shrink-0 w-36 cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="relative aspect-square bg-gradient-to-br from-amber-50 to-orange-100 p-1">
              <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover rounded" loading="lazy" />
              <Badge variant="secondary" className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 bg-amber-500/90 text-white border-0">
                {product.type === 'purchased' ? '🛒 Dibeli' : product.type === 'searched' ? '🔍 Dicari' : '⭐ Populer'}
              </Badge>
              {product.current_stock <= 0 && (
                <Badge variant="destructive" className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5">Habis</Badge>
              )}
              <Button
                size="icon"
                className="absolute bottom-1 right-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${product.id}`);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="p-2">
              <p className="text-xs text-muted-foreground truncate">{product.categories?.name || 'Kategori'}</p>
              <h3 className="font-medium text-xs line-clamp-2 h-8 text-foreground">{product.name}</h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-primary font-bold text-xs">{formatPrice(product.selling_price)}</span>
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 text-amber-400 fill-current" />
                  <span className="text-[10px] text-muted-foreground">4.5</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;
