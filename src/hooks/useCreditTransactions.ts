
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCreditTransactions = (searchTerm: string) => {
  return useQuery({
    queryKey: ['credit-transactions', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          customers(name, phone, email),
          profiles(full_name)
        `)
        .eq('is_credit', true);
      
      if (searchTerm) {
        query = query.or(`transaction_number.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    }
  });
};
