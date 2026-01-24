import { useEffect, useCallback } from 'react';

export interface POSShortcutActions {
  onSearch: () => void;           // F1
  onPayment: () => void;          // F2
  onMultiScan: () => void;        // F3
  onSelectCustomer: () => void;   // F4
  onProcessTransaction: () => void; // F5
  onVoiceSearch: () => void;      // F6
  onPaymentMethod: () => void;    // F7
  onPrintReceipt: () => void;     // F8
  onHoldTransaction: () => void;  // F9
  onClearCart: () => void;        // ESC
}

export interface ShortcutInfo {
  key: string;
  label: string;
  description: string;
}

export const POS_SHORTCUTS: ShortcutInfo[] = [
  { key: 'F1', label: 'F1', description: 'Fokus Pencarian' },
  { key: 'F2', label: 'F2', description: 'Input Pembayaran' },
  { key: 'F3', label: 'F3', description: 'Multi Scan' },
  { key: 'F4', label: 'F4', description: 'Pilih Pelanggan' },
  { key: 'F5', label: 'F5', description: 'Proses Transaksi' },
  { key: 'F6', label: 'F6', description: 'Voice Search' },
  { key: 'F7', label: 'F7', description: 'Metode Bayar' },
  { key: 'F8', label: 'F8', description: 'Print Faktur' },
  { key: 'F9', label: 'F9', description: 'Hold/Recall' },
  { key: 'ESC', label: 'ESC', description: 'Kosongkan Keranjang' },
];

export const usePOSKeyboardShortcuts = (actions: POSShortcutActions, enabled: boolean = true) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    // Allow ESC even when typing
    if (event.key === 'Escape') {
      event.preventDefault();
      actions.onClearCart();
      return;
    }

    // Skip other shortcuts if typing
    if (isTyping) return;

    switch (event.key) {
      case 'F1':
        event.preventDefault();
        actions.onSearch();
        break;
      case 'F2':
        event.preventDefault();
        actions.onPayment();
        break;
      case 'F3':
        event.preventDefault();
        actions.onMultiScan();
        break;
      case 'F4':
        event.preventDefault();
        actions.onSelectCustomer();
        break;
      case 'F5':
        event.preventDefault();
        actions.onProcessTransaction();
        break;
      case 'F6':
        event.preventDefault();
        actions.onVoiceSearch();
        break;
      case 'F7':
        event.preventDefault();
        actions.onPaymentMethod();
        break;
      case 'F8':
        event.preventDefault();
        actions.onPrintReceipt();
        break;
      case 'F9':
        event.preventDefault();
        actions.onHoldTransaction();
        break;
    }
  }, [actions]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return { shortcuts: POS_SHORTCUTS };
};
