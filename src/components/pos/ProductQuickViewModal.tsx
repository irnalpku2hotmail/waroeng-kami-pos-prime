import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Package, Plus, Minus, ShoppingCart } from 'lucide-react';
import { getImageUrl } from '@/hooks/usePOS';

interface ProductQuickViewModalProps {
  product: any | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: any, quantity: number) => void;
}

const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  open,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const imageUrl = getImageUrl(product.image_url);
  const maxStock = product.current_stock || 0;
  const isOutOfStock = maxStock <= 0;

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= maxStock) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setQuantity(1);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Detail Produk</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Product Image */}
          <div className="aspect-square w-full max-w-[200px] mx-auto bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-16 w-16 text-muted-foreground" />
            )}
          </div>

          {/* Product Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-2xl font-bold text-primary">
              Rp {product.selling_price?.toLocaleString('id-ID') || '0'}
            </p>
            
            <div className="flex items-center justify-center gap-2">
              <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
                Stok: {maxStock}
              </Badge>
              <Badge variant="outline">
                {product.loyalty_points || 1} pts
              </Badge>
            </div>

            {product.price_variants?.length > 0 && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Harga Grosir:</p>
                <div className="space-y-1">
                  {product.price_variants.map((variant: any, index: number) => (
                    <div key={index} className="text-xs flex justify-between">
                      <span>{variant.name} (min. {variant.minimum_quantity})</span>
                      <span className="font-medium">Rp {variant.price?.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-20 text-center"
                min={1}
                max={maxStock}
              />
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= maxStock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isOutOfStock 
              ? 'Stok Habis' 
              : `Tambah ke Keranjang (Rp ${((product.selling_price || 0) * quantity).toLocaleString('id-ID')})`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQuickViewModal;
