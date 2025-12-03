import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProductLikes } from '@/hooks/useProductLikes';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ 
  productId, 
  size = 'md',
  variant = 'icon',
  className 
}) => {
  const { isLiked, toggleLike } = useProductLikes();
  const liked = isLiked(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleLike(productId);
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (variant === 'button') {
    return (
      <Button
        variant={liked ? 'default' : 'outline'}
        size="sm"
        onClick={handleClick}
        className={cn(
          liked 
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
            : 'border-gray-300 hover:border-red-400 hover:text-red-500',
          className
        )}
      >
        <Heart className={cn(iconSizes[size], liked && 'fill-current', 'mr-2')} />
        {liked ? 'Di Wishlist' : 'Wishlist'}
      </Button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        sizeClasses[size],
        'flex items-center justify-center rounded-full transition-all duration-200',
        'bg-white/90 hover:bg-white shadow-sm hover:shadow-md',
        liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400',
        className
      )}
      aria-label={liked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
    >
      <Heart className={cn(iconSizes[size], liked && 'fill-current')} />
    </button>
  );
};

export default WishlistButton;
