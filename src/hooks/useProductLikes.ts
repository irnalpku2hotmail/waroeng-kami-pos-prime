
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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

    const { data, error } = await supabase
      .from('user_product_likes')
      .select('product_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching likes:', error);
      return;
    }

    const likes = new Set(data?.map(like => like.product_id) || []);
    setLikedProducts(likes);
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

    if (isLiked) {
      // Remove like
      const { error } = await supabase
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
      const { error } = await supabase
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
  };

  return {
    likedProducts,
    toggleLike,
    isLiked: (productId: string) => likedProducts.has(productId)
  };
};
