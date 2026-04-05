import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface AllProductsProps {
  searchTerm?: string;
  selectedCategory?: string;
  selectedBrand?: string;
  onAuthRequired?: () => void;
  onClearFilters?: () => void;
}

const AllProducts = ({ searchTerm, selectedCategory, selectedBrand, onAuthRequired, onClearFilters }: AllProductsProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();
  const [visibleCount, setVisibleCount] = useState(20);

  const hasFilters = (searchTerm && searchTerm.length > 0) || (selectedCategory && selectedCategory !== 'all') || (selectedBrand && selectedBrand !== 'all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['all-products-home', searchTerm, selectedCategory, selectedBrand],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`*, categories(id, name), product_brands(id, name, logo_url)`)
        .eq('is_active', true)
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedBrand && selectedBrand !== 'all') {
        query = query.eq('brand_id', selectedBrand);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data || [];
    }
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return '/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    const { data } = supabase.storage.from('product-images').getPublicUrl(imageUrl);
    return data.publicUrl;
  };

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onAuthRequired?.(); return; }
    if (product.current_stock <= 0) return;
    addToCart({
      id: product.id, name: product.name, price: product.selling_price,
      quantity: 1, image: product.image_url, stock: product.current_stock,
      product_id: product.id, unit_price: product.selling_price, total_price: product.selling_price,
    });
    toast({ title: 'Ditambahkan', description: `${product.name} ke keranjang` });
  };

  const visibleProducts = products.slice(0, visibleCount);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'}`}>
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square rounded-lg mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-sm md:text-base text-foreground">
            {hasFilters ? `Hasil Pencarian (${products.length})` : 'Semua Produk'}
          </h2>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={onClearFilters}>
            <X className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">Pencarian: {searchTerm}</Badge>
          )}
          {selectedCategory && selectedCategory !== 'all' && (
            <Badge variant="secondary" className="text-xs">Kategori difilter</Badge>
          )}
          {selectedBrand && selectedBrand !== 'all' && (
            <Badge variant="secondary" className="text-xs">Brand difilter</Badge>
          )}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Tidak ada produk ditemukan</p>
          {hasFilters && (
            <Button variant="link" className="mt-2 text-xs" onClick={onClearFilters}>
              Reset filter
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3'}`}>
            {visibleProducts.map((product: any) => (
              <div
                key={product.id}
                onClick={() => {
                  if (!user) { onAuthRequired?.(); return; }
                  navigate(`/product/${product.id}`);
                }}
                className="bg-card rounded-xl overflow-hidden border border-border/50 cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-accent/20">
                  <img
                    src={getImageUrl(product.image_url)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {product.current_stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge variant="destructive" className="text-[10px]">Habis</Badge>
                    </div>
                  )}
                  {product.current_stock > 0 && (
                    <Button
                      size="icon"
                      className="absolute bottom-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary shadow-md"
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <ShoppingCart className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-1">
                    {product.name}
                  </h3>
                  <p className="text-primary font-bold text-xs">{formatPrice(product.selling_price)}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {product.categories?.name && (
                      <span className="text-[9px] text-muted-foreground truncate">{product.categories.name}</span>
                    )}
                    {product.product_brands?.name && (
                      <>
                        <span className="text-[9px] text-muted-foreground">·</span>
                        <span className="text-[9px] text-muted-foreground truncate">{product.product_brands.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {visibleCount < products.length && (
            <div className="text-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount(prev => prev + 20)}
                className="text-xs"
              >
                Lihat Lebih Banyak ({products.length - visibleCount} lagi)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllProducts;
