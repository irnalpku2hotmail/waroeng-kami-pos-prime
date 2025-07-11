
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, 
  ShoppingCart, 
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import UserDropdown from '@/components/layout/UserDropdown';
import CartModal from '@/components/CartModal';
import AuthModal from '@/components/AuthModal';

interface HomeNavbarProps {
  storeName: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onProductSelect?: (product: any) => void;
}

interface SearchResults {
  products: Array<{
    id: string;
    name: string;
    image_url: string;
    selling_price: number;
    current_stock: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    icon_url: string;
  }>;
}

const HomeNavbar = ({ storeName, searchTerm, onSearchChange, onProductSelect }: HomeNavbarProps) => {
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Search products and categories
  const { data: searchResults } = useQuery({
    queryKey: ['search', localSearchTerm],
    queryFn: async (): Promise<SearchResults> => {
      if (!localSearchTerm || localSearchTerm.length < 2) {
        return { products: [], categories: [] };
      }
      
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
    if (localSearchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(localSearchTerm.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleProductSelect = (product: any) => {
    setSearchOpen(false);
    onProductSelect?.(product);
  };

  const handleCategorySelect = (category: any) => {
    setSearchOpen(false);
    navigate(`/search?category=${category.id}`);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasResults = searchResults && (searchResults.products.length > 0 || searchResults.categories.length > 0);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
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
                      placeholder="Search products or categories..."
                      value={localSearchTerm}
                      onChange={(e) => setLocalSearchTerm(e.target.value)}
                      onFocus={() => setSearchOpen(true)}
                      className="pl-10 pr-4 w-full rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </form>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandList>
                    {!hasResults && (
                      <CommandEmpty>No results found.</CommandEmpty>
                    )}
                    
                    {searchResults && searchResults.categories.length > 0 && (
                      <CommandGroup heading="Categories">
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
                    
                    {searchResults && searchResults.products.length > 0 && (
                      <CommandGroup heading="Products">
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
                                  Out of Stock
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
                  onClick={() => setCartModalOpen(true)}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Login to Your Account</DialogTitle>
                    </DialogHeader>
                    <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      <CartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
    </nav>
  );
};

export default HomeNavbar;
