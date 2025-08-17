
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Search, Star } from 'lucide-react';
import HomeNavbar from '@/components/home/HomeNavbar';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';

const Home = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch active products only
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          selling_price,
          current_stock,
          image_url,
          description,
          categories (name)
        `)
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('name')
        .limit(20);

      if (error) throw error;
      return data || [];
    }
  });

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image: product.image_url,
      stock: product.current_stock
    });
    
    toast({
      title: 'Ditambahkan ke keranjang',
      description: `${product.name} berhasil ditambahkan`
    });
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <HomeNavbar onCartClick={() => setCartModalOpen(true)} />

      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Belanja Online Mudah & Terpercaya
          </h1>
          <p className="text-blue-100 mb-8 text-lg">
            Temukan produk terbaik dengan harga terjangkau
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex bg-white rounded-lg shadow-lg overflow-hidden">
              <input
                type="text"
                placeholder="Cari produk yang Anda inginkan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-6 py-4 text-gray-900 text-lg focus:outline-none"
              />
              <Button
                onClick={handleSearch}
                className="bg-orange-500 hover:bg-orange-600 px-8 py-4 text-lg"
              >
                <Search className="h-5 w-5 mr-2" />
                Cari
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produk Pilihan</h2>
          <p className="text-gray-600">Produk terbaik dengan kualitas terjamin</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="bg-gray-200 h-40 rounded-lg mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded mb-2"></div>
                  <div className="bg-gray-200 h-6 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardContent className="p-0">
                  <div onClick={() => handleProductClick(product.id)}>
                    <div className="relative">
                      <img
                        src={getImageUrl(product.image_url)}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-t-lg"
                      />
                      {product.current_stock < 10 && (
                        <Badge variant="destructive" className="absolute top-2 left-2 text-xs">
                          Stok Terbatas
                        </Badge>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      {product.categories && (
                        <p className="text-xs text-gray-500 mb-2">
                          {product.categories.name}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-lg font-bold text-orange-600">
                            Rp {product.selling_price.toLocaleString('id-ID')}
                          </p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-500">4.5</span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs text-gray-500">Terjual 100+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 pb-4">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Keranjang
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {products.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum ada produk tersedia
            </h3>
            <p className="text-gray-600">
              Produk akan segera hadir. Silakan cek kembali nanti.
            </p>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      <EnhancedFrontendCartModal
        open={cartModalOpen}
        onOpenChange={setCartModalOpen}
      />
    </div>
  );
};

export default Home;
