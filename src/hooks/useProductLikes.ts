
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useProductLikes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: likedProducts = [] } = useQuery({
    queryKey: ['user-liked-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_product_likes')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(like => like.product_id);
    },
    enabled: !!user?.id
  });

  const toggleLike = useMutation({
    mutationFn: async (productId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const isLiked = likedProducts.includes(productId);
      
      if (isLiked) {
        const { error } = await supabase
          .from('user_product_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from('user_product_likes')
          .insert({
            user_id: user.id,
            product_id: productId
          });
        
        if (error) throw error;
        return true;
      }
    },
    onSuccess: (isLiked, productId) => {
      queryClient.invalidateQueries({ queryKey: ['user-liked-products', user?.id] });
      toast({
        title: isLiked ? 'Produk disukai' : 'Produk tidak disukai',
        description: isLiked ? 'Produk telah ditambahkan ke favorit' : 'Produk telah dihapus dari favorit'
      });
    },
    onError: (error) => {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status like produk',
        variant: 'destructive'
      });
    }
  });

  return {
    likedProducts,
    toggleLike: toggleLike.mutate,
    isLoading: toggleLike.isPending
  };
};
