
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCreditTransactions = (searchTerm: string) => {
  return useQuery({
    queryKey: ['credit-transactions', searchTerm],
    queryFn: async () => {
      // Get all credit transactions
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
      
      const { data: transactions, error } = await query.order('due_date', { ascending: true });
      if (error) throw error;

      // Get all credit payments to calculate remaining balance
      const { data: payments } = await supabase
        .from('credit_payments')
        .select('transaction_id, payment_amount');

      // Calculate total paid per transaction
      const paidByTransaction: Record<string, number> = {};
      payments?.forEach(payment => {
        if (!paidByTransaction[payment.transaction_id]) {
          paidByTransaction[payment.transaction_id] = 0;
        }
        paidByTransaction[payment.transaction_id] += payment.payment_amount;
      });

      // Enrich transactions with remaining balance and filter only active (remaining > 0)
      const enrichedTransactions = transactions?.map(tx => {
        const totalPaid = paidByTransaction[tx.id] || 0;
        const remainingAmount = tx.total_amount - totalPaid;
        return {
          ...tx,
          total_paid: totalPaid,
          remaining_amount: remainingAmount > 0 ? remainingAmount : 0,
          is_fully_paid: remainingAmount <= 0
        };
      }).filter(tx => tx.remaining_amount > 0); // Only show active credits (not fully paid)

      return enrichedTransactions;
    }
  });
};
