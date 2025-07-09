
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { Search, ShoppingCart, Package, Heart, Star, ArrowRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';

const Frontend = () => {
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['frontend-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch products with pagination (show all products including out of stock)
  const { data: productsData } = useQuery({
    queryKey: ['frontend-products', searchTerm, selectedCategory, currentPage],
    queryFn: async () => {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name, icon_url),
          units(name, abbreviation)
        `, { count: 'exact' })
        .eq('is_active', true)
        .range(from, to)
        .order('name');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      const { data, error, count } = await query;
      if (error) throw error;
      
      return { data: data || [], count: count || 0 };
    }
  });

  const products = productsData?.data || [];
  const totalProducts = productsData?.count || 0;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  // Fetch featured products for carousel
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(abbreviation)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleAddToCart = (product: any) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to cart',
        variant: 'destructive'
      });
      return;
    }

    if (product.current_stock <= 0) {
      toast({
        title: 'Out of Stock',
        description: 'This product is currently out of stock',
        variant: 'destructive'
      });
      return;
    }

    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      quantity: 1,
      unit_price: product.selling_price,
      total_price: product.selling_price,
      current_stock: product.current_stock
    });

    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart`
    });
  };

  const isProductInCart = (productId: string) => {
    return items.some(item => item.id === productId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Waroeng Kami</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!user ? (
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => window.location.href = '/auth/login'}>
                    Login
                  </Button>
                  <Button onClick={() => window.location.href = '/auth/register'}>
                    Register
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                    Dashboard
                  </Button>
                  <Button variant="outline" size="icon" className="relative">
                    <ShoppingCart className="h-4 w-4" />
                    {items.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {items.length}
                      </Badge>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="container mx-auto px-4 py-8">
        <Carousel 
          className="w-full max-w-6xl mx-auto"
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
        >
          <CarouselContent>
            {featuredProducts.map((product) => (
              <CarouselItem key={product.id}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative flex items-center justify-between p-12 min-h-[400px]">
                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <Badge className="bg-white/20 text-white border-white/30">
                          Featured Product
                        </Badge>
                        <h2 className="text-4xl font-bold leading-tight">
                          {product.name}
                        </h2>
                      </div>
                      
                      <p className="text-xl text-white/90 max-w-md">
                        {product.description || 'Premium quality product at the best price'}
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl font-bold">
                          Rp {product.selling_price.toLocaleString('id-ID')}
                        </div>
                        {product.current_stock <= 0 && (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                      </div>
                      
                      <div className="flex space-x-4">
                        <Button 
                          size="lg" 
                          className="bg-white text-gray-900 hover:bg-gray-100"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.current_stock <= 0 || !user}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {!user ? 'Login to Add' : product.current_stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                        <Button 
                          size="lg" 
                          variant="outline" 
                          className="border-white text-white hover:bg-white/10"
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Wishlist
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex justify-end">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-80 h-80 object-cover rounded-xl shadow-2xl"
                        />
                      ) : (
                        <div className="w-80 h-80 bg-white/20 rounded-xl flex items-center justify-center">
                          <Package className="h-32 w-32 text-white/50" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </div>

      {/* Search and Categories */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-gray-900">Shop by Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className="h-20 flex-col space-y-2 hover:shadow-lg transition-all"
              >
                <Package className="h-6 w-6" />
                <span className="text-sm font-medium">All Products</span>
              </Button>
              
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="h-20 flex-col space-y-2 hover:shadow-lg transition-all"
                >
                  {category.icon_url ? (
                    <img src={category.icon_url} alt={category.name} className="h-6 w-6" />
                  ) : (
                    <Package className="h-6 w-6" />
                  )}
                  <span className="text-sm font-medium text-center">{category.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCategory ? 
                `${categories.find(c => c.id === selectedCategory)?.name} Products` : 
                'All Products'
              }
            </h2>
            <div className="text-gray-600">
              Showing {products.length} of {totalProducts} products
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {product.current_stock <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-white">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                  
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {product.categories?.name}
                      </Badge>
                      {product.current_stock > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">4.5</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-gray-900">
                        Rp {product.selling_price.toLocaleString('id-ID')}
                      </div>
                      <div className="text-xs text-gray-600">
                        Stock: {product.current_stock} {product.units?.abbreviation}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.current_stock <= 0 || !user}
                    variant={isProductInCart(product.id) ? "outline" : "default"}
                  >
                    {product.current_stock <= 0 ? (
                      'Out of Stock'
                    ) : !user ? (
                      'Login to Purchase'
                    ) : isProductInCart(product.id) ? (
                      'In Cart'
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <Button 
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 2 && page <= currentPage + 2)
                )
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  </div>
                ))}
              
              <Button 
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Package className="h-8 w-8 text-blue-400" />
              <h3 className="text-2xl font-bold">Waroeng Kami</h3>
            </div>
            <p className="text-gray-400">
              Your trusted marketplace for quality products at the best prices
            </p>
            <div className="text-sm text-gray-500">
              © 2024 Waroeng Kami. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Frontend;
