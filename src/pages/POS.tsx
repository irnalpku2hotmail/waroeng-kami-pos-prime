
import Layout from '@/components/Layout';
import { usePOS } from '@/hooks/usePOS';
import ProductSearch from '@/components/pos/ProductSearch';
import ProductGrid from '@/components/pos/ProductGrid';
import CartSidebar from '@/components/pos/CartSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CustomerFavoritesModal from '@/components/pos/CustomerFavoritesModal';

const POS = () => {
  const pos = usePOS();
  const isMobile = useIsMobile();
  const [cartOpen, setCartOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  return (
    <Layout>
      <div className={`${isMobile ? 'space-y-4' : 'flex gap-6 h-[calc(100vh-120px)]'}`}>
        {/* Products Section */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Point of Sale</h1>
            {isMobile && (
              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button className="relative">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Keranjang ({pos.cart.length})
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-96 p-0">
                  <div className="p-4">
                    <CartSidebar {...pos} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
          
          <ProductSearch
            searchTerm={pos.searchTerm}
            setSearchTerm={pos.setSearchTerm}
            handleVoiceSearch={pos.handleVoiceSearch}
          />
          <ProductGrid
            products={pos.products}
            isLoading={pos.isLoading}
            addToCart={pos.addToCart}
          />

          {/* Customer Favorites Button */}
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setFavoritesOpen(true)}
              className="w-full max-w-md"
            >
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Favorit Pelanggan
            </Button>
          </div>
        </div>

        {/* Cart Section - Desktop Only */}
        {!isMobile && (
          <CartSidebar {...pos} />
        )}
      </div>

      {/* Customer Favorites Modal */}
      <CustomerFavoritesModal
        open={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        customerId={pos.selectedCustomer?.id || null}
        onAddToCart={pos.addToCart}
      />
    </Layout>
  );
};

export default POS;
