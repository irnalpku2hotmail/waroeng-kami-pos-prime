
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useUnitConversions = (productId?: string) => {
  return useQuery({
    queryKey: ['unit-conversions', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('unit_conversions')
        .select(`
          *,
          from_unit:from_unit_id(id, name, abbreviation),
          to_unit:to_unit_id(id, name, abbreviation)
        `)
        .eq('product_id', productId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId
  });
};

export const useAllUnits = () => {
  return useQuery({
    queryKey: ['all-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });
};

export const getConversionFactor = async (
  productId: string,
  fromUnitId: string,
  toUnitId: string
): Promise<number> => {
  if (fromUnitId === toUnitId) return 1;
  
  const { data, error } = await supabase.rpc('get_unit_conversion_factor', {
    p_product_id: productId,
    p_from_unit_id: fromUnitId,
    p_to_unit_id: toUnitId
  });
  
  if (error) {
    console.error('Error getting conversion factor:', error);
    return 1;
  }
  
  return data || 1;
};
