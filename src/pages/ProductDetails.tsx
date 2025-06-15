
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Package, Star, ArrowLeft, Heart, Truck, Minus, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProductLikes } from '@/hooks/useProductLikes';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const ProductDetails = () => {
    const { productId } = useParams<{ productId: string }>();
    const { addItem } = useCart();
    const { isLiked, toggleLike } = useProductLikes();
    const [quantity, setQuantity] = useState(1);
    const navigate = useNavigate();

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    categories(name),
                    units(name, abbreviation),
                    price_variants(
                        id,
                        name,
                        price,
                        minimum_quantity,
                        is_active
                    )
                `)
                .eq('id', productId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!productId,
    });
    
    const getImageUrl = (imageUrl: string | null | undefined) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(imageUrl);
        
        return data.publicUrl;
    };

    const getBestPrice = (product: any, quantity: number = 1) => {
        if (!product.price_variants || product.price_variants.length === 0) {
            return {
                price: product.selling_price,
                isWholesale: false,
                variantName: null,
                minQuantity: 1
            };
        }
    
        const activeVariants = product.price_variants
            .filter((variant: any) => variant.is_active)
            .sort((a: any, b: any) => b.minimum_quantity - a.minimum_quantity);
    
        for (const variant of activeVariants) {
            if (quantity >= variant.minimum_quantity) {
                return {
                    price: variant.price,
                    isWholesale: true,
                    variantName: variant.name,
                    minQuantity: variant.minimum_quantity
                };
            }
        }
    
        return {
            price: product.selling_price,
            isWholesale: false,
            variantName: null,
            minQuantity: 1
        };
    };

    const handleAddToCart = () => {
        if (!product) return;
        const priceInfo = getBestPrice(product, quantity);
        
        const cartItem = {
            id: Date.now().toString(),
            product_id: product.id,
            name: product.name,
            image_url: product.image_url,
            quantity: quantity,
            unit_price: priceInfo.price,
            total_price: priceInfo.price * quantity,
            current_stock: product.current_stock,
            loyalty_points: product.loyalty_points || 1,
            original_price: product.selling_price,
            is_wholesale: priceInfo.isWholesale,
            wholesale_min_qty: priceInfo.minQuantity
        };
        
        addItem(cartItem);
    };

    const increaseQuantity = () => {
        if(product && quantity < product.current_stock) {
            setQuantity(q => q + 1);
        }
    }

    const decreaseQuantity = () => {
        if(quantity > 1) {
            setQuantity(q => q - 1);
        }
    }

    if (isLoading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <Skeleton className="h-10 w-48 mb-4" />
                    <Card>
                        <div className="grid md:grid-cols-2 gap-8 p-8">
                            <Skeleton className="w-full aspect-square rounded-lg" />
                            <div className="space-y-6">
                                <Skeleton className="h-10 w-3/4" />
                                <Skeleton className="h-6 w-1/4" />
                                <Skeleton className="h-12 w-1/2" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }
    if (error) return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p>Could not load product details. Please try again later.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Home
            </Button>
        </div>
    );
    if (!product) return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
            <p>The product you are looking for does not exist.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Home
            </Button>
        </div>
    );
    
    const productImageUrl = getImageUrl(product.image_url);
    const productIsLiked = isLiked(product.id);
    const priceInfo = getBestPrice(product, quantity);
    const hasWholesalePrice = product.price_variants && product.price_variants.some((v: any) => v.is_active);

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to products
                </Button>

                <Card>
                    <div className="grid md:grid-cols-2 gap-8 p-8">
                        <div className="relative">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                {productImageUrl ? (
                                    <img src={productImageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="h-24 w-24 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => toggleLike(product.id)}
                                className={`absolute top-4 left-4 h-10 w-10 p-0 rounded-full transition-colors ${
                                productIsLiked 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-white/80 hover:bg-white'
                                }`}
                            >
                                <Heart className={`h-5 w-5 ${productIsLiked ? 'fill-current' : ''}`} />
                            </Button>
                        </div>

                        <div className="flex flex-col space-y-4">
                            <h1 className="text-3xl font-bold">{product.name}</h1>
                            
                            <div className="flex items-center gap-4">
                                <Badge variant="outline">{product.categories?.name || 'Uncategorized'}</Badge>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="text-sm text-gray-500">{product.loyalty_points || 1} pts</span>
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-3xl font-bold text-blue-600">
                                    Rp {priceInfo.price?.toLocaleString('id-ID')}
                                </span>
                                {priceInfo.isWholesale && (
                                    <div className="text-sm text-orange-600 font-medium">
                                        {priceInfo.variantName} (min. {priceInfo.minQuantity})
                                    </div>
                                )}
                                {hasWholesalePrice && !priceInfo.isWholesale && product.selling_price > priceInfo.price && (
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    Rp {product.selling_price?.toLocaleString('id-ID')}
                                  </span>
                                )}
                                {hasWholesalePrice && (
                                    <div className="text-sm text-gray-500 mt-1">
                                        Harga grosir tersedia untuk pembelian dalam jumlah besar.
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-600">{product.description || 'No description available.'}</p>
                            
                            <div className="flex items-center space-x-4">
                                <span className="font-medium">Kuantitas:</span>
                                <div className="flex items-center border rounded-md">
                                    <Button variant="ghost" size="sm" onClick={decreaseQuantity}><Minus className="h-4 w-4"/></Button>
                                    <Input 
                                        type="number" 
                                        className="w-16 text-center border-x-0 focus-visible:ring-0" 
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        min="1"
                                        max={product.current_stock}
                                    />
                                    <Button variant="ghost" size="sm" onClick={increaseQuantity}><Plus className="h-4 w-4"/></Button>
                                </div>
                                <span className="text-sm text-gray-500">Stok: {product.current_stock}</span>
                            </div>

                            <Button 
                                size="lg" 
                                onClick={handleAddToCart} 
                                disabled={product.current_stock <= 0 || quantity > product.current_stock}
                                className="w-full"
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {product.current_stock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
                            </Button>

                            <div className="flex items-center gap-2 text-sm text-green-600 pt-4">
                                <Truck className="h-5 w-5" />
                                <span>Tersedia untuk Bayar di Tempat (COD)</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProductDetails;
