
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft, Filter, Star, X, SlidersHorizontal, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import AuthModal from '@/components/AuthModal';
import EnhancedHomeSearch from '@/components/home/EnhancedHomeSearch';
import WhatsAppFloatingButton from '@/components/frontend/WhatsAppFloatingButton';
import WishlistButton from '@/components/wishlist/WishlistButton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const SearchResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialBrand = searchParams.get('brand') || 'all';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'newest'>('relevance');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const isMobile = useIsMobile();

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ['brands-filter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('product_brands').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch products with ranked search
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['search-products', searchQuery, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy],
    queryFn: async () => {
      let finalData: any[] = [];

      if (searchQuery) {
        // Use the ranked search RPC
        const { data: rankedResults, error: rpcError } = await supabase
          .rpc('search_products_ranked' as any, {
            search_term: searchQuery,
            category_filter: selectedCategory !== 'all' ? selectedCategory : null,
            brand_filter: selectedBrand !== 'all' ? selectedBrand : null,
            min_price: minPrice ? parseFloat(minPrice) : null,
            max_price: maxPrice ? parseFloat(maxPrice) : null,
            max_results: 100
          });

        if (!rpcError && rankedResults && Array.isArray(rankedResults) && rankedResults.length > 0) {
          // Fetch full product data with relations for the ranked results
          const productIds = (rankedResults as any[]).map((p: any) => p.id);
          const scoreMap = new Map((rankedResults as any[]).map((p: any) => [p.id, p.relevance_score]));
          
          const { data: fullProducts } = await supabase
            .from('products')
            .select(`
              *,
              categories(id, name),
              units(name, abbreviation),
              product_brands(id, name, logo_url)
            `)
            .in('id', productIds)
            .eq('is_active', true);

          // Sort by relevance score from RPC
          finalData = (fullProducts || []).sort((a, b) => {
            const scoreA = scoreMap.get(a.id) || 0;
            const scoreB = scoreMap.get(b.id) || 0;
            return Number(scoreB) - Number(scoreA);
          });
        } else {
          // Fallback: basic ilike search
          let query = supabase
            .from('products')
            .select(`*, categories(id, name), units(name, abbreviation), product_brands(id, name, logo_url)`)
            .eq('is_active', true)
            .ilike('name', `%${searchQuery}%`);

          if (selectedCategory !== 'all') query = query.eq('category_id', selectedCategory);
          if (selectedBrand !== 'all') query = query.eq('brand_id', selectedBrand);
          if (minPrice) query = query.gte('selling_price', parseFloat(minPrice));
          if (maxPrice) query = query.lte('selling_price', parseFloat(maxPrice));

          const { data } = await query.order('name').limit(100);
          finalData = data || [];
        }
      } else {
        // No search query - just apply filters
        let query = supabase
          .from('products')
          .select(`*, categories(id, name), units(name, abbreviation), product_brands(id, name, logo_url)`)
          .eq('is_active', true)
          .order('name');

        if (selectedCategory !== 'all') query = query.eq('category_id', selectedCategory);
        if (selectedBrand !== 'all') query = query.eq('brand_id', selectedBrand);
        if (minPrice) query = query.gte('selling_price', parseFloat(minPrice));
        if (maxPrice) query = query.lte('selling_price', parseFloat(maxPrice));

        const { data } = await query.limit(100);
        finalData = data || [];
      }

      // Log search analytics
      if (searchQuery) {
        const categoryName = selectedCategory !== 'all' 
          ? categories.find(c => c.id === selectedCategory)?.name 
          : null;

        await supabase.from('search_analytics').insert({
          user_id: user?.id || null,
          search_query: searchQuery,
          results_count: finalData?.length || 0,
          category_filter: categoryName
        });
      }

      // Apply client-side sort
      if (sortBy === 'price_asc') {
        finalData = [...finalData].sort((a, b) => (a.selling_price || 0) - (b.selling_price || 0));
      } else if (sortBy === 'price_desc') {
        finalData = [...finalData].sort((a, b) => (b.selling_price || 0) - (a.selling_price || 0));
      } else if (sortBy === 'newest') {
        finalData = [...finalData].sort((a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      }

      return finalData;
    }
  });

  // Fetch product ratings (avg + count) for visible products
  const productIds = products.map((p: any) => p.id);
  const { data: ratingsMap = {} } = useQuery({
    queryKey: ['product-ratings-search', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return {};
      const { data } = await supabase
        .from('product_reviews')
        .select('product_id, rating')
        .in('product_id', productIds);
      const map: Record<string, { avg: number; count: number }> = {};
      (data || []).forEach((r: any) => {
        if (!map[r.product_id]) map[r.product_id] = { avg: 0, count: 0 };
        map[r.product_id].count += 1;
        map[r.product_id].avg += r.rating;
      });
      Object.keys(map).forEach(id => {
        map[id].avg = map[id].avg / map[id].count;
      });
      return map;
    },
    enabled: productIds.length > 0,
  });

  // Apply rating filter client-side
  const filteredProducts = minRating > 0
    ? products.filter((p: any) => (ratingsMap[p.id]?.avg || 0) >= minRating)
    : products;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    navigate(`/search?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedBrand !== 'all' ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const full = Math.floor(rating);
    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={cn(
              sizeClass,
              i <= full ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'
            )}
          />
        ))}
      </div>
    );
  };

  // Filter Sidebar Content (reused for mobile sheet + desktop sidebar)
  const FilterSidebar = () => (
    <div className="space-y-5">
      {/* Category */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2.5">Kategori</h3>
        <ScrollArea className="max-h-48">
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'flex items-center justify-between w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors',
                selectedCategory === 'all'
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground/80 hover:bg-muted'
              )}
            >
              <span>Semua Kategori</span>
              {selectedCategory === 'all' && <Check className="h-3.5 w-3.5" />}
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center justify-between w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors',
                  selectedCategory === cat.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground/80 hover:bg-muted'
                )}
              >
                <span className="truncate">{cat.name}</span>
                {selectedCategory === cat.id && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Brand */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2.5">Brand</h3>
        <ScrollArea className="max-h-48">
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedBrand('all')}
              className={cn(
                'flex items-center justify-between w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors',
                selectedBrand === 'all'
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground/80 hover:bg-muted'
              )}
            >
              <span>Semua Brand</span>
              {selectedBrand === 'all' && <Check className="h-3.5 w-3.5" />}
            </button>
            {brands.map((brand: any) => (
              <button
                key={brand.id}
                onClick={() => setSelectedBrand(brand.id)}
                className={cn(
                  'flex items-center justify-between w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors',
                  selectedBrand === brand.id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground/80 hover:bg-muted'
                )}
              >
                <span className="truncate">{brand.name}</span>
                {selectedBrand === brand.id && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2.5">Rentang Harga</h3>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-9 text-sm"
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2.5">Penilaian</h3>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map(r => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? 0 : r)}
              className={cn(
                'flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md transition-colors',
                minRating === r
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground/80 hover:bg-muted'
              )}
            >
              {renderStars(r)}
              <span className="text-xs">{r === 5 ? '5' : `${r} & ke atas`}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <Button
        variant="outline"
        size="sm"
        onClick={handleClearFilters}
        className="w-full"
      >
        <X className="h-3.5 w-3.5 mr-1.5" />
        Hapus Semua Filter
      </Button>
    </div>
  );

  return (
    <div className={`min-h-screen bg-muted/20 ${isMobile ? 'pb-20 pt-12' : 'pt-[88px]'}`}>
      <FrontendNavbar
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        onCartClick={() => setShowCartModal(true)}
        searchComponent={
          <EnhancedHomeSearch
            searchTerm={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        }
      />

      {/* Header strip */}
      <div className="bg-card border-b border-border/60">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="h-8 px-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm md:text-base font-semibold text-foreground truncate">
              {searchQuery ? (
                <>Hasil pencarian: <span className="text-primary">"{searchQuery}"</span></>
              ) : (
                'Semua Produk'
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Memuat...' : `${filteredProducts.length} produk ditemukan`}
            </p>
          </div>
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="hidden md:block h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="relevance">Paling Relevan</option>
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
          {/* Mobile filter trigger */}
          {isMobile && (
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 relative">
                  <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                  Filter
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[9px] bg-destructive">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter Produk
                  </SheetTitle>
                </SheetHeader>
                <FilterSidebar />
                <div className="mt-6 sticky bottom-0 bg-background pt-3 border-t">
                  <Button onClick={() => setMobileFilterOpen(false)} className="w-full">
                    Lihat {filteredProducts.length} Produk
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Mobile sort chips */}
        {isMobile && (
          <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { value: 'relevance', label: 'Relevan' },
              { value: 'newest', label: 'Terbaru' },
              { value: 'price_asc', label: 'Termurah' },
              { value: 'price_desc', label: 'Termahal' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value as any)}
                className={cn(
                  'flex-shrink-0 px-3 py-1 text-xs rounded-full border transition-colors',
                  sortBy === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-foreground/70'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="max-w-7xl mx-auto px-3 md:px-4 pb-3 flex flex-wrap gap-1.5">
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory('all')} className="hover:bg-background/50 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedBrand !== 'all' && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {brands.find((b: any) => b.id === selectedBrand)?.name}
                <button onClick={() => setSelectedBrand('all')} className="hover:bg-background/50 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(minPrice || maxPrice) && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {minPrice ? formatPrice(Number(minPrice)) : 'Rp0'} – {maxPrice ? formatPrice(Number(maxPrice)) : '∞'}
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="hover:bg-background/50 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {minRating > 0 && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {minRating}+
                <button onClick={() => setMinRating(0)} className="hover:bg-background/50 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-primary hover:underline px-2 py-0.5"
            >
              Hapus semua
            </button>
          </div>
        )}
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4">
        <div className="flex gap-4">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <aside className="hidden md:block w-60 lg:w-64 flex-shrink-0">
              <div className="sticky top-[100px] bg-card rounded-lg border border-border/60 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Filter Produk</h2>
                </div>
                <FilterSidebar />
              </div>
            </aside>
          )}

          {/* Product grid */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
                {[...Array(10)].map((_, i) => (
                  <Card key={i} className="animate-pulse overflow-hidden">
                    <div className="aspect-[4/3] bg-muted" />
                    <CardContent className="p-2 space-y-1.5">
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-card rounded-lg border border-border/60 py-16 text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                  <Filter className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-foreground font-semibold mb-1">Produk tidak ditemukan</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Coba ubah kata kunci atau hapus filter pencarian
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Hapus Filter
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
                {filteredProducts.map((product: any) => {
                  const rating = ratingsMap[product.id];
                  const outOfStock = product.current_stock <= 0;
                  return (
                    <Card
                      key={product.id}
                      className="overflow-hidden cursor-pointer group border border-border/60 hover:border-orange-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] rounded-xl"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No Image
                          </div>
                        )}
                        {/* Wishlist */}
                        <div className="absolute top-1 right-1 z-10">
                          <WishlistButton productId={product.id} size="sm" />
                        </div>
                        {/* Brand badge */}
                        {product.product_brands?.name && (
                          <div className="absolute top-1 left-1">
                            <span className="bg-background/90 backdrop-blur-sm text-[9px] font-semibold text-foreground px-1.5 py-0.5 rounded">
                              {product.product_brands.name}
                            </span>
                          </div>
                        )}
                        {outOfStock && (
                          <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
                            <Badge variant="destructive" className="text-[10px]">Habis</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <h3 className="font-semibold text-xs text-foreground line-clamp-2 leading-tight mb-1 min-h-[2em]">
                          {product.name}
                        </h3>
                        <p className="text-xs font-bold text-primary mb-1">
                          {formatPrice(product.selling_price)}
                        </p>
                        <div className="flex items-center justify-between gap-1">
                          {rating && rating.count > 0 ? (
                            <div className="flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                              <span className="text-[9px] font-medium text-foreground">
                                {rating.avg.toFixed(1)}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                ({rating.count})
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-muted-foreground">Belum ada ulasan</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <MinimalFooter />

      {/* Modals */}
      {user && (
        <EnhancedFrontendCartModal 
          open={showCartModal} 
          onOpenChange={setShowCartModal} 
        />
      )}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav 
          onCartClick={() => setShowCartModal(true)}
          onAuthClick={() => setAuthModalOpen(true)}
        />
      )}

      {/* WhatsApp Floating Button */}
      <WhatsAppFloatingButton className={isMobile ? 'bottom-24' : ''} />
    </div>
  );
};

export default SearchResults;
