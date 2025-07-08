
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Search, Package, Heart, Star, ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import FrontendCart from '@/components/FrontendCart';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const Frontend = () => {
  const { user } = useAuth();
  const { addItem, getTotalItems } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Fetch all products without authentication requirement
  const { data: products = [] } = useQuery({
    queryKey: ['frontend-products', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(name, icon_url),
          units(name, abbreviation),
          price_variants(*)
        `);
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
      }
      
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      
      const { data, error } = await query.order('name');
      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }
      return data || [];
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      return data || [];
    }
  });

  // Fetch featured products for carousel
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          units(name, abbreviation)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) {
        console.error('Error fetching featured products:', error);
        return [];
      }
      return data || [];
    }
  });

  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl);
    
    return data.publicUrl;
  };

  const getBestPrice = (product: any) => {
    if (product.price_variants?.length > 0) {
      const activeVariants = product.price_variants
        .filter((variant: any) => variant.is_active)
        .sort((a: any, b: any) => a.minimum_quantity - b.minimum_quantity);
      
      if (activeVariants.length > 0) {
        return {
          originalPrice: product.selling_price,
          bestPrice: activeVariants[0].price,
          hasDiscount: activeVariants[0].price < product.selling_price
        };
      }
    }
    return {
      originalPrice: product.selling_price,
      bestPrice: product.selling_price,
      hasDiscount: false
    };
  };

  const handleAddToCart = (product: any) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to add items to cart',
        variant: 'destructive'
      });
      return;
    }

    const priceInfo = getBestPrice(product);
    
    const cartItem = {
      id: Date.now().toString(),
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      quantity: 1,
      unit_price: priceInfo.bestPrice,
      total_price: priceInfo.bestPrice,
      current_stock: product.current_stock,
      original_price: product.selling_price,
      is_wholesale: priceInfo.hasDiscount,
      wholesale_min_qty: product.price_variants?.[0]?.minimum_quantity || 1
    };

    addItem(cartItem);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-blue-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-xl">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SmartPOS Store
                </h1>
                <p className="text-sm text-gray-600">Your Premium Shopping Destination</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                    {getTotalItems() > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                        {getTotalItems()}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Guest Mode - Login to Shop
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Carousel */}
        <Card className="mb-8 overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl">
          <CardContent className="p-0">
            <Carousel className="w-full">
              <CarouselContent>
                {featuredProducts.map((product, index) => {
                  const productImageUrl = getImageUrl(product.image_url);
                  const priceInfo = getBestPrice(product);
                  
                  return (
                    <CarouselItem key={product.id}>
                      <div className="flex items-center justify-between p-8 min-h-[300px]">
                        <div className="flex-1 space-y-4">
                          <Badge className="bg-white/20 text-white border-white/30">
                            Featured Product
                          </Badge>
                          <h2 className="text-4xl font-bold leading-tight">
                            {product.name}
                          </h2>
                          <p className="text-xl opacity-90">
                            {product.description || "Premium quality product for your needs"}
                          </p>
                          <div className="flex items-center space-x-4">
                            <span className="text-3xl font-bold">
                              Rp {priceInfo.bestPrice.toLocaleString('id-ID')}
                            </span>
                            {priceInfo.hasDiscount && (
                              <span className="text-lg line-through opacity-70">
                                Rp {priceInfo.originalPrice.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-sm opacity-80">(4.8/5.0)</span>
                          </div>
                        </div>
                        {productImageUrl && (
                          <div className="flex-shrink-0 ml-8">
                            <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                              <img 
                                src={productImageUrl} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
              <CarouselNext className="right-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
            </Carousel>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Search className="h-5 w-5" />
                  Search Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-gray-800">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === '' ? 'default' : 'ghost'}
                  className={`w-full justify-start ${selectedCategory === '' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'hover:bg-blue-50'}`}
                  onClick={() => setSelectedCategory('')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  All Products
                </Button>
                {categories.map((category) => {
                  const categoryImageUrl = getImageUrl(category.icon_url);
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      className={`w-full justify-start ${selectedCategory === category.id ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'hover:bg-blue-50'}`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {categoryImageUrl ? (
                        <img src={categoryImageUrl} alt={category.name} className="h-4 w-4 mr-2 rounded" />
                      ) : (
                        <Package className="h-4 w-4 mr-2" />
                      )}
                      {category.name}
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Cart */}
            {user && <FrontendCart />}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Products'}
              </h2>
              <p className="text-gray-600">
                {products.length} products available
              </p>
            </div>

            {products.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">No products found</p>
                  <p className="text-gray-400">Try adjusting your search or category filter</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => {
                  const productImageUrl = getImageUrl(product.image_url);
                  const priceInfo = getBestPrice(product);
                  const isOutOfStock = product.current_stock <= 0;
                  
                  return (
                    <Card key={product.id} className={`group hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm transform hover:-translate-y-2 ${isOutOfStock ? 'opacity-75' : ''}`}>
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden rounded-t-lg">
                          {productImageUrl ? (
                            <img 
                              src={productImageUrl} 
                              alt={product.name}
                              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <Package className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-2 left-2 space-y-1">
                            {isOutOfStock && (
                              <Badge variant="destructive" className="shadow-lg">
                                Out of Stock
                              </Badge>
                            )}
                            {priceInfo.hasDiscount && (
                              <Badge className="bg-green-500 shadow-lg">
                                Wholesale
                              </Badge>
                            )}
                          </div>
                          
                          <div className="absolute top-2 right-2">
                            <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full bg-white/80 hover:bg-white">
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {product.categories?.name} • Stock: {product.current_stock} {product.units?.abbreviation}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xl font-bold text-blue-600">
                                Rp {priceInfo.bestPrice.toLocaleString('id-ID')}
                              </span>
                              {priceInfo.hasDiscount && (
                                <span className="text-sm line-through text-gray-400 ml-2">
                                  Rp {priceInfo.originalPrice.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                            onClick={() => handleAddToCart(product)}
                            disabled={!user || isOutOfStock}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {!user ? 'Login to Add' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Frontend;
