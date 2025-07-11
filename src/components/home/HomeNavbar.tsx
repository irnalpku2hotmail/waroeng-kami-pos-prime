
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  ShoppingCart, 
  User,
  Heart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import UserDropdown from '@/components/layout/UserDropdown';

interface HomeNavbarProps {
  storeName: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onProductSelect?: (product: any) => void;
}

const HomeNavbar = ({ storeName, searchTerm, onSearchChange, onProductSelect }: HomeNavbarProps) => {
  const { user } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Search products and categories
  const { data: searchResults = [] } = useQuery({
    queryKey: ['search', localSearchTerm],
    queryFn: async () => {
      if (!localSearchTerm || localSearchTerm.length < 2) return [];
      
      // Search products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, image_url, selling_price, current_stock')
        .or(`name.ilike.%${localSearchTerm}%,barcode.ilike.%${localSearchTerm}%`)
        .eq('is_active', true)
        .limit(5);

      // Search categories
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, icon_url')
        .ilike('name', `%${localSearchTerm}%`)
        .limit(3);

      if (productsError) console.error('Products search error:', productsError);
      if (categoriesError) console.error('Categories search error:', categoriesError);

      return {
        products: products || [],
        categories: categories || []
      };
    },
    enabled: localSearchTerm.length >= 2
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearchTerm);
    setSearchOpen(false);
  };

  const handleProductSelect = (product: any) => {
    setSearchOpen(false);
    onProductSelect?.(product);
  };

  const handleCategorySelect = (category: any) => {
    setSearchOpen(false);
    navigate(`/?category=${category.id}`);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="font-bold text-xl text-gray-900">{storeName}</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <form onSubmit={handleSearch}>
                    <Input
                      type="text"
                      placeholder="Cari produk atau kategori..."
                      value={localSearchTerm}
                      onChange={(e) => setLocalSearchTerm(e.target.value)}
                      onFocus={() => setSearchOpen(true)}
                      className="pl-10 pr-4 w-full"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </form>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandList>
                    {searchResults.products?.length === 0 && searchResults.categories?.length === 0 && (
                      <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
                    )}
                    
                    {searchResults.categories?.length > 0 && (
                      <CommandGroup heading="Kategori">
                        {searchResults.categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            onSelect={() => handleCategorySelect(category)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              {category.icon_url && (
                                <img src={category.icon_url} alt="" className="w-6 h-6" />
                              )}
                              <span>{category.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    
                    {searchResults.products?.length > 0 && (
                      <CommandGroup heading="Produk">
                        {searchResults.products.map((product) => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => handleProductSelect(product)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <img 
                                src={product.image_url || '/placeholder.svg'} 
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{product.name}</div>
                                <div className="text-xs text-gray-500">
                                  Rp {product.selling_price.toLocaleString('id-ID')}
                                </div>
                              </div>
                              {product.current_stock <= 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  Habis
                                </Badge>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/cart')}
                  className="relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
                <UserDropdown />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;
