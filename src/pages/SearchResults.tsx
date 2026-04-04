
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
import { ShoppingCart, Heart, ArrowLeft, Filter } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import AuthModal from '@/components/AuthModal';
import EnhancedHomeSearch from '@/components/home/EnhancedHomeSearch';
import WhatsAppFloatingButton from '@/components/frontend/WhatsAppFloatingButton';

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
  const [showFilters, setShowFilters] = useState(false);
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
    queryKey: ['search-products', searchQuery, selectedCategory, selectedBrand, minPrice, maxPrice],
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

      return finalData;
    }
  });

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
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''} ${isMobile ? 'pt-12' : 'pt-[88px]'}`}>
      {/* Reusable Navbar with EnhancedHomeSearch */}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Hasil Pencarian
            {searchQuery && (
              <span className="text-blue-600"> untuk "{searchQuery}"</span>
            )}
          </h1>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="mb-4"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>

          {/* Filters */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2">Kategori</Label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="all">Semua Kategori</option>
                      {categories.map((category: any) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2">Brand</Label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="all">Semua Brand</option>
                      {brands.map((brand: any) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2">Harga Minimum</Label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2">Harga Maximum</Label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSearch}>Terapkan Filter</Button>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <CardContent className="p-3">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada produk ditemukan</p>
            <p className="text-gray-400 text-sm mt-2">
              Coba ubah kata kunci atau filter pencarian Anda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product: any) => (
              <Card 
                key={product.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {product.current_stock <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive">Habis</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-blue-600 font-bold">
                    {formatPrice(product.selling_price)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.categories?.name && (
                      <Badge variant="secondary" className="text-xs">
                        {product.categories.name}
                      </Badge>
                    )}
                    {product.product_brands?.name && (
                      <Badge variant="outline" className="text-xs">
                        {product.product_brands.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
