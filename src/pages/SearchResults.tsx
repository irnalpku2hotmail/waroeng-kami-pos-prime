
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
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const isMobile = useIsMobile();

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

  // Fetch products with search and filters
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['search-products', searchQuery, selectedCategory, minPrice, maxPrice],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name),
          units(name, abbreviation)
        `)
        .eq('is_active', true)
        .order('name');

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (minPrice) {
        query = query.gte('selling_price', parseFloat(minPrice));
      }

      if (maxPrice) {
        query = query.lte('selling_price', parseFloat(maxPrice));
      }

      const { data, error } = await query;
      if (error) throw error;

      // If no results and we have a search query, try fuzzy search
      let finalData = data;
      if ((!data || data.length === 0) && searchQuery) {
        const { data: similarProducts, error: similarError } = await supabase
          .rpc('get_similar_products' as any, {
            search_term: searchQuery,
            category_filter: selectedCategory !== 'all' ? selectedCategory : null,
            similarity_threshold: 0.2,
            max_results: 20
          });

        if (!similarError && similarProducts && Array.isArray(similarProducts) && similarProducts.length > 0) {
          const productIds = (similarProducts as any[]).map((p: any) => p.id);
          const { data: fullProducts } = await supabase
            .from('products')
            .select(`
              *,
              categories(id, name),
              units(name, abbreviation)
            `)
            .in('id', productIds)
            .eq('is_active', true);
          
          finalData = fullProducts || [];
        }
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
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-20' : ''}`}>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-2">Kategori</Label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border rounded-md"
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
                  {product.categories?.name && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {product.categories.name}
                    </Badge>
                  )}
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
