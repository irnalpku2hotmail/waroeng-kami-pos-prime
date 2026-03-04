
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Package, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import FrontendNavbar from '@/components/frontend/FrontendNavbar';
import EnhancedHomeSearch from '@/components/home/EnhancedHomeSearch';
import MinimalFooter from '@/components/frontend/MinimalFooter';
import AuthModal from '@/components/AuthModal';
import EnhancedFrontendCartModal from '@/components/frontend/EnhancedFrontendCartModal';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import WhatsAppFloatingButton from '@/components/frontend/WhatsAppFloatingButton';
import { Skeleton } from '@/components/ui/skeleton';

const BundleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: bundle, isLoading } = useQuery({
    queryKey: ['bundle-detail', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('bundles')
        .select('*, bundle_items(*, products(id, name, image_url, selling_price, current_stock, units(abbreviation)))')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);

  const handleAddAllToCart = () => {
    if (!user) { setAuthModalOpen(true); return; }
    if (!bundle?.bundle_items) return;

    let outOfStock = false;
    for (const item of bundle.bundle_items) {
      const product = (item as any).products;
      if (!product || product.current_stock < item.quantity) {
        outOfStock = true;
        toast({ title: 'Stok Habis', description: `${product?.name || 'Produk'} tidak tersedia`, variant: 'destructive' });
        continue;
      }

      // Calculate proportional bundle discount per item
      const itemOriginalTotal = product.selling_price * item.quantity;
      const discountRatio = bundle.discount_price / bundle.original_price;
      const discountedUnitPrice = Math.round(product.selling_price * discountRatio);

      addToCart({
        id: product.id,
        name: product.name,
        price: discountedUnitPrice,
        quantity: item.quantity,
        image: product.image_url,
        stock: product.current_stock,
        product_id: product.id,
        unit_price: discountedUnitPrice,
        total_price: discountedUnitPrice * item.quantity,
        product: { id: product.id, name: product.name, image_url: product.image_url },
      });
    }

    if (!outOfStock) {
      toast({ title: 'Berhasil! 🎉', description: 'Semua produk paket ditambahkan ke keranjang' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <FrontendNavbar searchTerm="" onSearchChange={() => {}} onCartClick={() => {}} searchComponent={<div />} />
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="aspect-video rounded-2xl" />
          <Skeleton className="h-12 w-64" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Paket tidak ditemukan</h2>
          <Button onClick={() => navigate('/')}>Kembali ke Beranda</Button>
        </div>
      </div>
    );
  }

  const allInStock = bundle.bundle_items?.every((item: any) => item.products?.current_stock >= item.quantity);

  return (
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-20' : ''}`}>
      <FrontendNavbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCartClick={() => setCartModalOpen(true)}
        searchComponent={<EnhancedHomeSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>

        {/* Hero */}
        <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl overflow-hidden mb-6">
          {bundle.image_url ? (
            <img src={bundle.image_url} alt={bundle.name} className="w-full aspect-video object-cover" />
          ) : (
            <div className="aspect-video flex items-center justify-center">
              <Package className="h-20 w-20 text-orange-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mb-6">
          <Badge className="bg-gradient-to-r from-orange-500 to-rose-500 text-white mb-3">Bundle Deal</Badge>
          <h1 className="text-2xl font-bold text-foreground mb-2">{bundle.name}</h1>
          {bundle.description && <p className="text-muted-foreground">{bundle.description}</p>}

          <div className="mt-4 bg-card rounded-xl p-4 border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Harga Normal</span>
              <span className="text-lg text-muted-foreground line-through">{formatPrice(bundle.original_price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Harga Paket</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(bundle.discount_price)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium text-green-600">Total Hemat</span>
              <span className="text-lg font-bold text-green-600">
                {formatPrice(Number(bundle.savings_amount))} ({Number(bundle.savings_percentage).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Isi Paket ({bundle.bundle_items?.length} Produk)</h2>
          <div className="space-y-3">
            {bundle.bundle_items?.map((item: any) => {
              const product = item.products;
              if (!product) return null;
              const inStock = product.current_stock >= item.quantity;
              return (
                <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border transition-all hover:shadow-sm cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{formatPrice(product.selling_price)} × {item.quantity}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {inStock ? (
                        <span className="text-[10px] text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Stok: {product.current_stock}</span>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Habis</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatPrice(product.selling_price * item.quantity)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className={`${isMobile ? 'fixed bottom-16 left-0 right-0 p-3 bg-background/95 backdrop-blur-sm border-t z-40' : ''}`}>
          <Button
            onClick={handleAddAllToCart}
            disabled={!allInStock}
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl shadow-lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {allInStock ? 'Tambah Semua ke Keranjang' : 'Beberapa Produk Habis'}
          </Button>
        </div>
      </div>

      {!isMobile && <MinimalFooter />}
      <EnhancedFrontendCartModal open={cartModalOpen} onOpenChange={setCartModalOpen} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      {isMobile && <MobileBottomNav onCartClick={() => setCartModalOpen(true)} onAuthClick={() => setAuthModalOpen(true)} />}
      <WhatsAppFloatingButton className={isMobile ? 'bottom-24' : ''} />
    </div>
  );
};

export default BundleDetail;
