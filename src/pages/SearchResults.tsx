
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Search, Package, Filter } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import EnhancedNavbar from '@/components/home/EnhancedNavbar';
import EnhancedFooter from '@/components/home/EnhancedFooter';
import CartModal from '@/components/CartModal';
import { useState } from 'react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const query = searchParams.get('q') || '';

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['search-products', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      // Search in products by name and description
      const { data: productResults, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('name');

      if (productError) throw productError;

      // Search in categories
      const { data: categoryResults, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .ilike('name', `%${query}%`);

      if (categoryError) throw categoryError;

      // If categories match, get products from those categories
      let categoryProductResults = [];
      if (categoryResults && categoryResults.length > 0) {
        const categoryIds = categoryResults.map(cat => cat.id);
        const { data: catProducts, error: catProductError } = await supabase
          .from('products')
          .select(`
            *,
            categories (name, id),
            units (name, abbreviation)
          `)
          .eq('is_active', true)
          .in('category_id', categoryIds)
          .order('name');

        if (catProductError) throw catProductError;
        categoryProductResults = catProducts || [];
      }

      // Combine and deduplicate results
      const allResults = [...(productResults || []), ...categoryProductResults];
      const uniqueResults = allResults.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );

      return uniqueResults;
    },
    enabled: !!query.trim()
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image: product.image_url,
      stock: product.current_stock,
      product_id: product.id,
      unit_price: product.selling_price,
      total_price: product.selling_price * 1,
      product: {
        id: product.id,
        name: product.name,
        image_url: product.image_url
      }
    });

    toast({
      title: 'Berhasil!',
      description: `${product.name} telah ditambahkan ke keranjang`,
    });
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedNavbar 
        onCartClick={() => setCartModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Hasil Pencarian
            </h1>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <p className="text-gray-600">
              Menampilkan hasil untuk: <span className="font-medium">"{query}"</span>
            </p>
          </div>
          {!isLoading && searchResults.length > 0 && (
            <Badge variant="outline" className="mb-4">
              {searchResults.length} produk ditemukan
            </Badge>
          )}
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Mencari produk...</p>
          </div>
        )}

        {!isLoading && searchResults.length === 0 && query.trim() && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Tidak ada hasil ditemukan
            </h2>
            <p className="text-gray-500 mb-4">
              Coba gunakan kata kunci yang berbeda atau lebih umum
            </p>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
            >
              Kembali ke Beranda
            </Button>
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
            {searchResults.map((product) => (
              <Card 
                key={product.id} 
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-sm hover:shadow-md"
                onClick={() => handleProductClick(product.id)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {product.categories && (
                      <Badge variant="secondary" className="text-xs">
                        {product.categories.name}
                      </Badge>
                    )}
                    
                    <h3 className="font-medium text-sm line-clamp-2 h-10">
                      {product.name}
                    </h3>
                    
                    <p className="text-lg font-bold text-blue-600">
                      {formatPrice(product.selling_price)}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={product.current_stock > 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
                      </Badge>
                      
                      <Button
                        size="sm"
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.current_stock === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ShoppingCart className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EnhancedFooter />
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </div>
  );
};

export default SearchResults;
