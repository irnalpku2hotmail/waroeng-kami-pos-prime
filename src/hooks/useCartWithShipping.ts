
import { useContext } from 'react';
import { CartContext } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCartWithShipping = () => {
  const cartContext = useContext(CartContext);
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (!cartContext) {
    throw new Error('useCartWithShipping must be used within a CartProvider');
  }

  return {
    ...cartContext,
    shippingInfo: profile ? {
      name: profile.full_name,
      phone: profile.phone,
      address: profile.address_text || profile.address,
      coordinates: profile.latitude && profile.longitude ? {
        lat: profile.latitude,
        lng: profile.longitude
      } : null
    } : null
  };
};
