
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, Grid, List } from 'lucide-react';
import ProductCardSmall from '@/components/home/ProductCardSmall';
import EnhancedSearchWithSuggestions from '@/components/home/EnhancedSearchWithSuggestions';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Update search term when URL changes
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    setSearchTerm(query);
    setSelectedCategory(category);
  }, [searchParams]);

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ['categories-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch store settings for footer
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      
      const settingsObj: Record<string, any> = {};
      data?.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      return settingsObj;
    }
  });

  // Fetch search results
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['search-results', searchTerm, selectedCategory, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          selling_price,
          current_stock,
          image_url,
          description,
          categories (id, name)
        `)
        .eq('is_active', true);

      // Apply search filter
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Apply category filter
      if (selectedCategory) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', selectedCategory)
          .single();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_low':
          query = query.order('selling_price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('selling_price', { ascending: false });
          break;
        case 'stock':
          query = query.order('current_stock', { ascending: false });
          break;
        default:
          query = query.order('name', { ascending: true });
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!(searchTerm || selectedCategory)
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    setSearchParams(params);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (category && category !== 'all') params.set('category', category);
    setSearchParams(params);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Navigation */}
      <div className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Kembali
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Hasil Pencarian</h1>
            </div>

            {/* Enhanced Search */}
            <EnhancedSearchWithSuggestions
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={handleSearch}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 mt-20">
        {/* Search Summary & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Summary */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">
                {searchTerm && `Mencari: "${searchTerm}"`}
                {selectedCategory && ` dalam kategori "${selectedCategory}"`}
              </span>
              {products.length > 0 && (
                <Badge variant="secondary">{products.length} produk ditemukan</Badge>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Category Filter */}
            <Select value={selectedCategory || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nama A-Z</SelectItem>
                <SelectItem value="price_low">Harga Terendah</SelectItem>
                <SelectItem value="price_high">Harga Tertinggi</SelectItem>
                <SelectItem value="stock">Stok Terbanyak</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-red-500 mb-2">Terjadi kesalahan saat memuat data</div>
              <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak ada produk ditemukan
              </h3>
              <p className="text-gray-600 mb-4">
                Coba ubah kata kunci pencarian atau filter kategori
              </p>
              <Button onClick={() => navigate('/')}>
                Kembali ke Beranda
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 
            'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : 
            'space-y-4'
          }>
            {products.map((product) => (
              <ProductCardSmall
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with Store Info */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {settings?.store_name?.name || 'Toko Online'}
              </h3>
              <p className="text-gray-300 text-sm">
                {settings?.store_address?.address || 'Alamat toko belum diatur'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Kontak</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p>📞 {settings?.store_phone?.phone || 'Telepon belum diatur'}</p>
                <p>✉️ {settings?.store_email?.email || 'Email belum diatur'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Tentang Kami</h4>
              <p className="text-sm text-gray-300">
                Toko online terpercaya dengan berbagai pilihan produk berkualitas.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm text-gray-400">
            <p>&copy; 2024 {settings?.store_name?.name || 'Toko Online'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SearchResults;
