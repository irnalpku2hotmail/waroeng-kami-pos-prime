import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Clock, TrendingUp, Folder, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SmartSearchSuggestionsProps {
  searchTerm: string;
  showSuggestions: boolean;
  selectedIndex: number;
  onClose: () => void;
  onSelectProduct: (productId: string) => void;
  onSearch: (query: string) => void;
  selectedCategory?: string;
}

const SmartSearchSuggestions = ({
  searchTerm,
  showSuggestions,
  selectedIndex,
  onClose,
  onSelectProduct,
  onSearch,
  selectedCategory,
}: SmartSearchSuggestionsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Recent searches from DB
  const { data: recentSearches = [] } = useQuery({
    queryKey: ['recent-searches', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('search_history')
        .select('search_term, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      // Deduplicate
      const seen = new Set<string>();
      return (data || []).filter(s => {
        const lower = s.search_term.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      }).slice(0, 5);
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Trending searches (most searched terms)
  const { data: trendingSearches = [] } = useQuery({
    queryKey: ['trending-searches'],
    queryFn: async () => {
      const { data } = await supabase
        .from('search_analytics')
        .select('search_query, results_count')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!data) return [];
      // Count frequency
      const freq: Record<string, number> = {};
      data.forEach(d => {
        const q = d.search_query.toLowerCase().trim();
        freq[q] = (freq[q] || 0) + 1;
      });
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([term]) => term);
    },
    staleTime: 60000,
  });

  // Smart product suggestions with ranking
  const { data: suggestions = [] } = useQuery({
    queryKey: ['smart-suggestions', searchTerm, selectedCategory],
    queryFn: async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) return [];

      // Fetch products with fuzzy match
      let query = supabase
        .from('products')
        .select(`
          id, name, image_url, selling_price, current_stock,
          categories (id, name)
        `)
        .eq('is_active', true)
        .limit(10);

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      query = query.ilike('name', `%${searchTerm}%`);
      const { data: exactMatches } = await query;

      // If few results, try fuzzy via RPC
      let fuzzyResults: any[] = [];
      if ((!exactMatches || exactMatches.length < 3) && searchTerm.length >= 3) {
        const { data: fuzzy } = await supabase.rpc('get_similar_products', {
          search_term: searchTerm,
          similarity_threshold: 0.15,
          max_results: 8,
          ...(selectedCategory && selectedCategory !== 'all' ? { category_filter: selectedCategory } : {}),
        });
        fuzzyResults = (fuzzy || []).map((p: any) => ({
          ...p,
          categories: null,
          _fuzzy: true,
          _similarity: p.similarity_score,
        }));
      }

      // Merge & deduplicate
      const allProducts = [...(exactMatches || []), ...fuzzyResults];
      const seen = new Set<string>();
      const unique = allProducts.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      // Smart ranking
      return unique
        .map(p => {
          const nameLower = p.name.toLowerCase();
          const termLower = searchTerm.toLowerCase();
          const exactMatch = nameLower.includes(termLower) ? 1 : 0;
          const startsMatch = nameLower.startsWith(termLower) ? 0.3 : 0;
          const stockScore = Math.min((p.current_stock || 0) / 100, 1);
          
          const score =
            (exactMatch + startsMatch) * 0.5 +
            stockScore * 0.2 +
            0.15 + // placeholder for rating
            0.1 + // placeholder for promo
            0.05;

          return { ...p, _score: score };
        })
        .sort((a, b) => b._score - a._score)
        .slice(0, 8);
    },
    enabled: searchTerm.length >= 2,
  });

  // Category suggestions
  const { data: categoryMatches = [] } = useQuery({
    queryKey: ['category-suggestions', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) return [];
      const { data } = await supabase
        .from('categories')
        .select('id, name, icon_url')
        .ilike('name', `%${searchTerm}%`)
        .limit(3);
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });

  // Brand suggestions
  const { data: brandMatches = [] } = useQuery({
    queryKey: ['brand-suggestions', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) return [];
      const { data } = await supabase
        .from('product_brands')
        .select('id, name, logo_url')
        .eq('is_active', true)
        .ilike('name', `%${searchTerm}%`)
        .limit(3);
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });

  // Detect potential typo correction
  const hasFuzzyOnly = suggestions.length > 0 && suggestions.every((s: any) => s._fuzzy);
  const fuzzyTopName = hasFuzzyOnly ? suggestions[0]?.name : null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  if (!showSuggestions) return null;

  const hasContent =
    searchTerm.length >= 2
      ? suggestions.length > 0 || categoryMatches.length > 0 || brandMatches.length > 0
      : recentSearches.length > 0 || trendingSearches.length > 0;

  if (!hasContent) return null;

  let globalIndex = 0;

  return (
    <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-xl border max-h-[70vh] overflow-y-auto">
      <CardContent className="p-2">
        {/* Typo correction */}
        {hasFuzzyOnly && fuzzyTopName && (
          <div className="px-3 py-2 text-sm text-muted-foreground bg-amber-50 rounded mb-2">
            Mungkin yang Anda cari: <button
              className="font-semibold text-[#03AC0E] hover:underline"
              onClick={() => onSearch(fuzzyTopName)}
            >"{fuzzyTopName}"</button>
          </div>
        )}

        {/* Empty state: show recent & trending */}
        {searchTerm.length < 2 && (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="mb-3">
                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pencarian Terakhir</p>
                {recentSearches.map((s) => (
                  <button
                    key={s.search_term + s.created_at}
                    onClick={() => onSearch(s.search_term)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded transition-colors text-left"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{s.search_term}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Trending */}
            {trendingSearches.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trending Hari Ini</p>
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => onSearch(term)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded transition-colors text-left"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                    <span className="truncate">{term}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Category suggestions */}
        {searchTerm.length >= 2 && categoryMatches.length > 0 && (
          <div className="mb-2">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kategori</p>
            {categoryMatches.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(searchTerm)}&category=${cat.id}`);
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded transition-colors text-left"
              >
                <Folder className="h-3.5 w-3.5 text-[#03AC0E] flex-shrink-0" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Brand suggestions */}
        {searchTerm.length >= 2 && brandMatches.length > 0 && (
          <div className="mb-2">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand</p>
            {brandMatches.map((brand) => (
              <button
                key={brand.id}
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(searchTerm)}&brand=${brand.id}`);
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded transition-colors text-left"
              >
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.name} className="h-4 w-4 object-contain rounded flex-shrink-0" />
                ) : (
                  <Tag className="h-3.5 w-3.5 text-[#03AC0E] flex-shrink-0" />
                )}
                <span>{brand.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Product suggestions */}
        {searchTerm.length >= 2 && suggestions.length > 0 && (
          <div className="space-y-0.5">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produk</p>
            {suggestions.map((product: any, index: number) => {
              const currentIdx = globalIndex++;
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    currentIdx === selectedIndex
                      ? 'bg-[#03AC0E]/10 ring-1 ring-[#03AC0E]/30'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => onSelectProduct(product.id)}
                >
                  <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.categories && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {product.categories.name}
                        </Badge>
                      )}
                      <span className="text-xs text-[#03AC0E] font-semibold">
                        {formatPrice(product.selling_price)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Stok: {product.current_stock}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* See all results */}
        {searchTerm.length >= 2 && (
          <div className="border-t mt-2 pt-2">
            <button
              onClick={() => onSearch(searchTerm)}
              className="w-full text-left p-2 text-sm text-[#03AC0E] hover:bg-accent rounded flex items-center gap-2 font-medium"
            >
              <Search className="h-4 w-4" />
              Lihat semua hasil untuk "{searchTerm}"
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartSearchSuggestions;
