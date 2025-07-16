
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Star, ShoppingCart, Search, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const SearchResults = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchParams.get('q') || '');
  
  const searchQuery = searchParams.get('q') || '';
  const categoryId = searchParams.get('category') || '';

  // Fetch search results
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search-results', searchQuery, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,barcode.ilike.%${searchQuery}%`);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch category name if searching by category
  const { data: categoryName } = useQuery({
    queryKey: ['category-name', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .single();
      
      if (error) return null;
      return data.name;
    },
    enabled: !!categoryId
  });

  // Fetch recommendations based on search or category
  const { data: recommendations = [] } = useQuery({
    queryKey: ['search-recommendations', searchQuery, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .eq('is_active', true)
        .limit(12);

      // If searching by category, get more products from the same category
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      } else if (searchQuery) {
        // If text search, get products from similar categories or popular products
        query = query.order('current_stock', { ascending: false });
      }

      const { data, error } = await query.order('selling_price', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!searchQuery || !!categoryId
  });

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to cart',
        variant: 'destructive'
      });
      return;
    }

    addItem(product);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart`
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchTerm.trim()) {
      setSearchParams({ q: localSearchTerm.trim() });
    }
  };

  const handleProductClick = (product: any) => {
    navigate(`/product/${product.id}`);
  };

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-10 rounded-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {categoryId && categoryName ? `Kategori: ${categoryName}` : 
             searchQuery ? `Hasil Pencarian untuk "${searchQuery}"` : 
             'Semua Produk'}
          </h1>
          <p className="text-gray-600">
            {isLoading ? 'Mencari...' : `Ditemukan ${results.length} produk`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-3">
                  <div className="h-3 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Tidak ada produk ditemukan</p>
            <p className="text-gray-500">Coba ubah kata kunci pencarian</p>
          </div>
        ) : (
          <>
            {/* Main Results */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-12">
              {results.map((product) => (
                <Card 
                  key={product.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="relative">
                    <img
                      src={getImageUrl(product.image_url)}
                      alt={product.name}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {product.current_stock <= 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-xs">
                          Stok Habis
                        </Badge>
                      </div>
                    )}
                    {product.current_stock <= product.min_stock && product.current_stock > 0 && (
                      <Badge className="absolute top-2 left-2 bg-orange-500 text-xs">
                        Terbatas
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-3">
                    <h3 className="font-semibold mb-2 text-xs line-clamp-2 h-8">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-blue-600">
                        Rp {product.selling_price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{product.current_stock}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>4.5</span>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full text-xs h-7"
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={product.current_stock <= 0}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Tambah ke Keranjang
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (categoryId || searchQuery) && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {categoryId ? 'Produk Lainnya dalam Kategori Ini' : 'Produk yang Sering Dicari'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {recommendations.filter(rec => !results.find(res => res.id === rec.id)).slice(0, 6).map((product) => (
                    <Card 
                      key={product.id}
                      className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="relative">
                        <img
                          src={getImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {product.current_stock <= 0 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <Badge variant="destructive" className="text-xs">
                              Stok Habis
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-3">
                        <h3 className="font-semibold mb-2 text-xs line-clamp-2 h-8">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-blue-600">
                            Rp {product.selling_price.toLocaleString('id-ID')}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>{product.current_stock}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>4.5</span>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          className="w-full text-xs h-7"
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={product.current_stock <= 0}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Tambah ke Keranjang
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
