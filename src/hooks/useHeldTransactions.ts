import { useState, useEffect, useCallback } from 'react';

export interface HeldTransaction {
  id: string;
  cart: any[];
  customer: any | null;
  paymentType: 'cash' | 'credit' | 'transfer';
  paymentAmount: number;
  transferReference: string;
  heldAt: string;
  note?: string;
}

const HELD_STORAGE_KEY = 'pos_held_transactions';

export const useHeldTransactions = () => {
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);

  // Load held transactions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(HELD_STORAGE_KEY);
    if (stored) {
      try {
        setHeldTransactions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse held transactions:', e);
      }
    }
  }, []);

  // Save to localStorage whenever held transactions change
  const saveToStorage = useCallback((transactions: HeldTransaction[]) => {
    localStorage.setItem(HELD_STORAGE_KEY, JSON.stringify(transactions));
    setHeldTransactions(transactions);
  }, []);

  // Hold current transaction
  const holdTransaction = useCallback((
    cart: any[],
    customer: any | null,
    paymentType: 'cash' | 'credit' | 'transfer',
    paymentAmount: number,
    transferReference: string,
    note?: string
  ) => {
    if (cart.length === 0) return null;

    const newHeld: HeldTransaction = {
      id: `HOLD-${Date.now()}`,
      cart,
      customer,
      paymentType,
      paymentAmount,
      transferReference,
      heldAt: new Date().toISOString(),
      note,
    };

    const updated = [...heldTransactions, newHeld];
    saveToStorage(updated);
    return newHeld;
  }, [heldTransactions, saveToStorage]);

  // Recall a held transaction
  const recallTransaction = useCallback((id: string) => {
    const transaction = heldTransactions.find(t => t.id === id);
    if (transaction) {
      const updated = heldTransactions.filter(t => t.id !== id);
      saveToStorage(updated);
    }
    return transaction || null;
  }, [heldTransactions, saveToStorage]);

  // Delete a held transaction without recalling
  const deleteHeldTransaction = useCallback((id: string) => {
    const updated = heldTransactions.filter(t => t.id !== id);
    saveToStorage(updated);
  }, [heldTransactions, saveToStorage]);

  // Update note on held transaction
  const updateHeldNote = useCallback((id: string, note: string) => {
    const updated = heldTransactions.map(t => 
      t.id === id ? { ...t, note } : t
    );
    saveToStorage(updated);
  }, [heldTransactions, saveToStorage]);

  return {
    heldTransactions,
    heldCount: heldTransactions.length,
    holdTransaction,
    recallTransaction,
    deleteHeldTransaction,
    updateHeldNote,
  };
};
