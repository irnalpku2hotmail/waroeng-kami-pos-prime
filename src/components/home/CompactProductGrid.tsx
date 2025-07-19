
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRef } from 'react';

const CompactProductGrid = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch featured products
  const { data: featuredProducts } = useQuery({
    queryKey: ['compact-featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, id),
          units (name, abbreviation)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    }
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produk Pilihan</h2>
          <p className="text-gray-600">Koleksi produk terbaik dengan harga terjangkau</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            className="rounded-full p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            className="rounded-full p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {featuredProducts?.map((product) => (
          <Link 
            to={`/product/${product.id}`} 
            key={product.id} 
            className="group flex-shrink-0 w-48 bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200"
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 relative">
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
              
              {/* Stock badge */}
              <div className="absolute top-2 right-2">
                <Badge 
                  variant={product.current_stock > 0 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {product.current_stock > 0 ? `${product.current_stock}` : 'Habis'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              {product.categories && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {product.categories.name}
                </Badge>
              )}
              
              <h3 className="font-semibold text-sm line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
              
              <div className="space-y-1">
                <p className="text-blue-600 font-bold">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(product.selling_price)}
                </p>
                
                <p className="text-xs text-gray-500">
                  Klik untuk detail & beli
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <Link to="/search">
          <Button variant="outline" className="px-8 py-2 rounded-xl">
            Lihat Semua Produk
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CompactProductGrid;
