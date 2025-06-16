
import Layout from '@/components/Layout';
import { usePOS } from '@/hooks/usePOS';
import ProductSearch from '@/components/pos/ProductSearch';
import ProductGrid from '@/components/pos/ProductGrid';
import CartSidebar from '@/components/pos/CartSidebar';

const POS = () => {
  const pos = usePOS();

  return (
    <Layout>
      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {/* Products Section */}
        <div className="flex-1 space-y-4">
          <ProductSearch
            searchTerm={pos.searchTerm}
            setSearchTerm={pos.setSearchTerm}
            handleVoiceSearch={pos.handleVoiceSearch}
            isVoiceActive={pos.isVoiceActive}
            setIsVoiceActive={pos.setIsVoiceActive}
          />
          <ProductGrid
            products={pos.products}
            isLoading={pos.isLoading}
            addToCart={pos.addToCart}
          />
        </div>

        {/* Cart Section */}
        <CartSidebar {...pos} />
      </div>
    </Layout>
  );
};

export default POS;
