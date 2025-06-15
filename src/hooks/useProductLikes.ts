
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface UserProductLike {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export const useProductLikes = () => {
  const { user } = useAuth();
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchUserLikes();
    }
  }, [user]);

  const fetchUserLikes = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('user_product_likes')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching likes:', error);
        return;
      }

      const likes = new Set(data?.map((like: any) => like.product_id as string) || []);
      setLikedProducts(likes);
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const toggleLike = async (productId: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Silakan login untuk menyukai produk',
        variant: 'destructive'
      });
      return;
    }

    const isLiked = likedProducts.has(productId);

    try {
      if (isLiked) {
        // Remove like
        const { error } = await (supabase as any)
          .from('user_product_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) {
          toast({
            title: 'Error',
            description: 'Gagal menghapus like',
            variant: 'destructive'
          });
          return;
        }

        setLikedProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        // Add like
        const { error } = await (supabase as any)
          .from('user_product_likes')
          .insert({
            user_id: user.id,
            product_id: productId
          });

        if (error) {
          toast({
            title: 'Error',
            description: 'Gagal menambah like',
            variant: 'destructive'
          });
          return;
        }

        setLikedProducts(prev => new Set([...prev, productId]));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memproses like',
        variant: 'destructive'
      });
    }
  };

  return {
    likedProducts,
    toggleLike,
    isLiked: (productId: string) => likedProducts.has(productId)
  };
};
