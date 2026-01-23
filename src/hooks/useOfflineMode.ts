import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CartItem } from '@/hooks/usePOS';

export interface OfflineTransaction {
  id: string;
  transaction_number: string;
  cart: CartItem[];
  total_amount: number;
  customer_id: string | null;
  customer_name: string | null;
  payment_type: 'cash' | 'credit' | 'transfer';
  payment_amount: number;
  change_amount: number;
  transfer_reference: string | null;
  points_earned: number;
  cashier_id: string | null;
  created_at: string;
  synced: boolean;
}

const OFFLINE_STORAGE_KEY = 'pos_offline_transactions';

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingTransactions, setPendingTransactions] = useState<OfflineTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending transactions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (stored) {
      try {
        const transactions = JSON.parse(stored) as OfflineTransaction[];
        setPendingTransactions(transactions.filter(t => !t.synced));
      } catch (error) {
        console.error('Failed to parse offline transactions:', error);
      }
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Koneksi Pulih',
        description: 'Anda kembali online. Sinkronisasi transaksi...',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Mode Offline',
        description: 'Transaksi akan disimpan lokal dan disinkronkan saat online.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingTransactions.length > 0) {
      syncTransactions();
    }
  }, [isOnline]);

  // Save transaction to localStorage
  const saveOfflineTransaction = useCallback((transaction: Omit<OfflineTransaction, 'id' | 'synced'>) => {
    const offlineTransaction: OfflineTransaction = {
      ...transaction,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
    };

    setPendingTransactions(prev => {
      const updated = [...prev, offlineTransaction];
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    toast({
      title: 'Transaksi Disimpan Offline',
      description: `${transaction.transaction_number} akan disinkronkan saat online.`,
    });

    return offlineTransaction;
  }, []);

  // Sync a single transaction to database
  const syncSingleTransaction = async (transaction: OfflineTransaction): Promise<boolean> => {
    try {
      // Insert transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transaction.transaction_number,
          total_amount: transaction.total_amount,
          cashier_id: transaction.cashier_id,
          customer_id: transaction.customer_id,
          payment_type: transaction.payment_type,
          payment_amount: transaction.payment_amount,
          change_amount: transaction.change_amount,
          is_credit: transaction.payment_type === 'credit',
          points_earned: transaction.points_earned,
          due_date: transaction.payment_type === 'credit' 
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
            : null,
          notes: transaction.transfer_reference 
            ? `Transfer Ref: ${transaction.transfer_reference} (Synced from offline)` 
            : '(Synced from offline)',
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Insert transaction items
      const transactionItems = transaction.cart.map(item => ({
        transaction_id: transactionData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Update customer points if applicable
      if (transaction.customer_id && transaction.points_earned > 0) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('total_points, total_spent')
          .eq('id', transaction.customer_id)
          .single();

        if (customerData) {
          await supabase
            .from('customers')
            .update({
              total_points: (customerData.total_points || 0) + transaction.points_earned,
              total_spent: (customerData.total_spent || 0) + transaction.total_amount,
            })
            .eq('id', transaction.customer_id);

          await supabase.from('point_transactions').insert({
            customer_id: transaction.customer_id,
            transaction_id: transactionData.id,
            points_change: transaction.points_earned,
            description: `Pembelian ${transaction.transaction_number} (offline sync)`,
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to sync transaction:', transaction.transaction_number, error);
      return false;
    }
  };

  // Sync all pending transactions
  const syncTransactions = useCallback(async () => {
    if (!isOnline || pendingTransactions.length === 0 || isSyncing) return;

    setIsSyncing(true);
    let syncedCount = 0;
    let failedCount = 0;

    for (const transaction of pendingTransactions) {
      if (transaction.synced) continue;

      const success = await syncSingleTransaction(transaction);
      if (success) {
        syncedCount++;
        transaction.synced = true;
      } else {
        failedCount++;
      }
    }

    // Update localStorage and state
    const updatedTransactions = pendingTransactions.map(t => 
      t.synced ? { ...t, synced: true } : t
    );
    
    const stillPending = updatedTransactions.filter(t => !t.synced);
    setPendingTransactions(stillPending);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(stillPending));

    setIsSyncing(false);

    if (syncedCount > 0) {
      toast({
        title: 'Sinkronisasi Berhasil',
        description: `${syncedCount} transaksi berhasil disinkronkan.`,
      });
    }

    if (failedCount > 0) {
      toast({
        title: 'Beberapa Gagal Sinkron',
        description: `${failedCount} transaksi gagal disinkronkan. Akan dicoba lagi.`,
        variant: 'destructive',
      });
    }
  }, [isOnline, pendingTransactions, isSyncing]);

  // Clear synced transactions
  const clearSyncedTransactions = useCallback(() => {
    const stillPending = pendingTransactions.filter(t => !t.synced);
    setPendingTransactions(stillPending);
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(stillPending));
  }, [pendingTransactions]);

  return {
    isOnline,
    pendingTransactions,
    pendingCount: pendingTransactions.length,
    isSyncing,
    saveOfflineTransaction,
    syncTransactions,
    clearSyncedTransactions,
  };
};
