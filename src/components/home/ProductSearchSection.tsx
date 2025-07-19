import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductSearchSection = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Fetch search results
  const { data: searchResults } = useQuery({
    queryKey: ['product-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return { products: [], categories: [] };

      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            categories!inner(name, id),
            units(name, abbreviation)
          `)
          .or(`name.ilike.%${searchTerm}%,categories.name.ilike.%${searchTerm}%`)
          .eq('is_active', true)
          .limit(12),
        supabase
          .from('categories')
          .select('id, name')
          .ilike('name', `%${searchTerm}%`)
          .limit(6)
      ]);

      return {
        products: productsResult.data || [],
        categories: categoriesResult.data || []
      };
    },
    enabled: searchTerm.length >= 2
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowResults(true);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setSearchTerm(categoryName);
    setShowResults(true);
  };

  const filteredProducts = searchResults?.products?.filter(product => {
    if (!searchTerm) return false;
    
    // Check if search term matches a category
    const matchingCategory = searchResults.categories?.find(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (matchingCategory) {
      return product.categories?.id === matchingCategory.id;
    }
    
    // Otherwise, search in product names
    return product.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cari Produk</h2>
        <p className="text-gray-600">Temukan produk yang Anda cari berdasarkan nama atau kategori</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari produk atau kategori..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(e.target.value.length >= 2);
            }}
            className="pl-12 pr-20 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400"
          />
          <Button 
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            Cari
          </Button>
        </div>
      </form>

      {/* Category Suggestions */}
      {searchResults?.categories && searchResults.categories.length > 0 && showResults && (
        <div className="max-w-4xl mx-auto mb-6">
          <h3 className="text-lg font-semibold mb-3">Kategori yang cocok:</h3>
          <div className="flex flex-wrap gap-2">
            {searchResults.categories.map((category) => (
              <Badge
                key={category.id}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 px-4 py-2"
                onClick={() => handleCategoryClick(category.name)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && searchTerm && (
        <div className="max-w-6xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">
            Hasil pencarian "{searchTerm}" ({filteredProducts.length} produk)
          </h3>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredProducts.map((product) => (
                <Link 
                  to={`/product/${product.id}`} 
                  key={product.id}
                  className="group bg-white rounded-xl shadow-md p-3 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {product.categories && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        {product.categories.name}
                      </Badge>
                    )}
                    
                    <h4 className="font-medium text-sm line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h4>
                    
                    <div className="space-y-1">
                      <p className="text-blue-600 font-bold text-sm">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(product.selling_price)}
                      </p>
                      
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        product.current_stock > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.current_stock > 0 ? `Stok: ${product.current_stock}` : 'Habis'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada produk yang ditemukan untuk "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearchSection;
