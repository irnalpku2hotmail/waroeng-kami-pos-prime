import Layout from '@/components/Layout';
import { usePOS } from '@/hooks/usePOS';
import { usePOSKeyboardShortcuts } from '@/hooks/usePOSKeyboardShortcuts';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useHeldTransactions } from '@/hooks/useHeldTransactions';
import ProductSearch from '@/components/pos/ProductSearch';
import ProductGrid from '@/components/pos/ProductGrid';
import CartSidebar from '@/components/pos/CartSidebar';
import KeyboardShortcutsHelp from '@/components/pos/KeyboardShortcutsHelp';
import OfflineIndicator from '@/components/pos/OfflineIndicator';
import HeldTransactionsModal from '@/components/pos/HeldTransactionsModal';
import DailySalesSummary from '@/components/pos/DailySalesSummary';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import CustomerFavoritesModal from '@/components/pos/CustomerFavoritesModal';
import MultiBarcodeScanner from '@/components/pos/MultiBarcodeScanner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useHardwareBarcodeScanner } from '@/hooks/useHardwareBarcodeScanner';
import { Switch } from '@/components/ui/switch';
const POS = () => {
  const pos = usePOS();
  const isMobile = useIsMobile();
  const [cartOpen, setCartOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [clearCartDialog, setClearCartDialog] = useState(false);
  const [multiScanOpen, setMultiScanOpen] = useState(false);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [holdModalTrigger, setHoldModalTrigger] = useState(0);

  // Hardware barcode scanner (keyboard wedge)
  const [hwMultiScan, setHwMultiScan] = useState(false);
  const [hwScanCount, setHwScanCount] = useState(0);
  const [lastHwScan, setLastHwScan] = useState<string | null>(null);
  const barcodeCache = useRef(new Map<string, any>());
  const scanQueue = useRef<Promise<void>>(Promise.resolve());
  const posRef = useRef(pos);
  posRef.current = pos;
  const hwMultiScanRef = useRef(hwMultiScan);
  hwMultiScanRef.current = hwMultiScan;
  const hwErrorToast = useRef<ReturnType<typeof toast> | null>(null);
  const showScanError = (title: string, description: string) => {
    // Single replaceable toast so rapid failed scans don't flood the screen
    hwErrorToast.current?.dismiss();
    hwErrorToast.current = toast({ title, description, variant: 'destructive', duration: 2500 });
  };

  const lookupBarcode = useCallback(async (barcode: string) => {
    const cached = barcodeCache.current.get(barcode);
    if (cached) return cached;
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name), units(name, abbreviation), price_variants(*)')
      .eq('barcode', barcode)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    if (data) barcodeCache.current.set(barcode, data);
    return data;
  }, []);

  const handleHardwareScan = useCallback((barcode: string) => {
    // Sequential queue: one physical scan = one lookup, order preserved
    scanQueue.current = scanQueue.current.then(async () => {
      if (!navigator.onLine && !barcodeCache.current.has(barcode)) {
        showScanError('Offline', `Tidak dapat mencari barcode ${barcode} saat offline.`);
        return;
      }
      try {
        const product = await lookupBarcode(barcode);
        if (!product) {
          showScanError('Barcode tidak ditemukan', `Barcode: ${barcode}`);
          return;
        }
        const batch = hwMultiScanRef.current;
        // Batch mode: no per-scan success toast, inline counter instead
        const ok = posRef.current.addToCart(product, 1, { silent: batch });
        if (!ok) return; // e.g. out of stock: not counted
        setLastHwScan(product.name);
        if (batch) setHwScanCount(c => c + 1);
      } catch {
        showScanError('Gagal mencari produk', 'Terjadi kesalahan saat membaca barcode.');
      }
    });
  }, [lookupBarcode]);

  // Held transactions
  const heldTransactions = useHeldTransactions();
  // Refs for focusing elements
  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentInputRef = useRef<HTMLInputElement>(null);
  const customerSelectRef = useRef<HTMLButtonElement>(null);
  const paymentMethodRef = useRef<HTMLButtonElement>(null);
  const voiceSearchRef = useRef<HTMLButtonElement>(null);

  // Offline mode
  const offlineMode = useOfflineMode();

  // Handle process transaction with offline support
  const handleProcessTransaction = useCallback(() => {
    if (!offlineMode.isOnline) {
      // Save transaction offline
      offlineMode.saveOfflineTransaction({
        transaction_number: `TRX${Date.now()}`,
        cart: pos.cart,
        total_amount: pos.getTotalAmount(),
        customer_id: pos.selectedCustomer?.id || null,
        customer_name: pos.selectedCustomer?.name || null,
        payment_type: pos.paymentType,
        payment_amount: pos.paymentType === 'cash' ? pos.paymentAmount : pos.getTotalAmount(),
        change_amount: pos.paymentType === 'cash' ? pos.getChangeAmount() : 0,
        transfer_reference: pos.paymentType === 'transfer' ? pos.transferReference : null,
        points_earned: pos.selectedCustomer ? pos.getTotalPointsEarned() : 0,
        cashier_id: pos.user?.id || null,
        created_at: new Date().toISOString()
      });

      // Clear cart and reset form
      pos.setCart([]);
      pos.setSelectedCustomer(null);
      pos.setPaymentAmount(0);
      pos.setPaymentType('cash');
      pos.setTransferReference('');
      toast({
        title: 'Transaksi Tersimpan Offline',
        description: 'Akan disinkronkan saat koneksi pulih.'
      });
    } else {
      pos.processTransaction.mutate();
    }
  }, [offlineMode, pos]);

  // Keyboard shortcut actions
  const shortcutActions = {
    onSearch: () => {
      searchInputRef.current?.focus();
    },
    onPayment: () => {
      if (pos.paymentType === 'cash') {
        paymentInputRef.current?.focus();
      }
      if (isMobile) setCartOpen(true);
    },
    onMultiScan: () => {
      setMultiScanOpen(true);
    },
    onSelectCustomer: () => {
      customerSelectRef.current?.click();
      if (isMobile) setCartOpen(true);
    },
    onProcessTransaction: () => {
      if (pos.cart.length > 0) {
        handleProcessTransaction();
      }
    },
    onVoiceSearch: () => {
      voiceSearchRef.current?.click();
    },
    onPaymentMethod: () => {
      paymentMethodRef.current?.click();
      if (isMobile) setCartOpen(true);
    },
    onPrintReceipt: () => {
      if (pos.cart.length > 0) {
        const mockTransaction = {
          transaction_number: `TRX${Date.now()}`,
          created_at: new Date().toISOString(),
          total_amount: pos.getTotalAmount()
        };
        pos.printReceipt(mockTransaction);
      }
    },
    onClearCart: () => {
      if (pos.cart.length > 0) {
        setClearCartDialog(true);
      }
    },
    onHoldTransaction: () => {
      setHoldModalTrigger(prev => prev + 1);
    }
  };
  usePOSKeyboardShortcuts(shortcutActions, true);

  useHardwareBarcodeScanner({
    enabled: !multiScanOpen,
    onScan: handleHardwareScan,
    allowedInputRef: searchInputRef,
    onRestoreInput: (before) => pos.setSearchTerm(before),
  });

  // Handle multi-barcode scan results
  const handleMultiScanProducts = (items: {
    product: any;
    quantity: number;
  }[]) => {
    items.forEach(({
      product,
      quantity
    }) => {
      pos.addToCart(product, quantity);
    });
    setMultiScanOpen(false);
  };

  // Handle hold current transaction
  const handleHoldCurrent = useCallback((note?: string) => {
    if (pos.cart.length === 0) {
      toast({
        title: 'Keranjang Kosong',
        description: 'Tidak ada item untuk ditahan.',
        variant: 'destructive'
      });
      return;
    }
    heldTransactions.holdTransaction(pos.cart, pos.selectedCustomer, pos.paymentType, pos.paymentAmount, pos.transferReference, note);

    // Clear current cart
    pos.setCart([]);
    pos.setSelectedCustomer(null);
    pos.setPaymentAmount(0);
    pos.setPaymentType('cash');
    pos.setTransferReference('');
    toast({
      title: 'Transaksi Ditahan',
      description: 'Transaksi berhasil disimpan sementara.'
    });
  }, [pos, heldTransactions]);

  // Handle recall held transaction
  const handleRecallTransaction = useCallback((id: string) => {
    const held = heldTransactions.recallTransaction(id);
    if (held) {
      pos.setCart(held.cart);
      pos.setSelectedCustomer(held.customer);
      pos.setPaymentType(held.paymentType);
      pos.setPaymentAmount(held.paymentAmount);
      pos.setTransferReference(held.transferReference);
      toast({
        title: 'Transaksi Dilanjutkan',
        description: `Transaksi ${id} berhasil dipulihkan.`
      });
    }
  }, [pos, heldTransactions]);
  const handleClearCart = () => {
    pos.setCart([]);
    pos.setSelectedCustomer(null);
    pos.setPaymentAmount(0);
    pos.setPaymentType('cash');
    pos.setTransferReference('');
    setClearCartDialog(false);
    toast({
      title: 'Keranjang Dikosongkan',
      description: 'Semua item telah dihapus dari keranjang.'
    });
  };
  return <Layout>
      <div className={`${isMobile ? 'space-y-4' : 'flex gap-6 h-[calc(100vh-120px)]'}`}>
        {/* Products Section */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">POS</h1>
            <div className="flex items-center gap-2">
              <OfflineIndicator isOnline={offlineMode.isOnline} pendingCount={offlineMode.pendingCount} isSyncing={offlineMode.isSyncing} onSync={offlineMode.syncTransactions} />
              <KeyboardShortcutsHelp />
              <HeldTransactionsModal heldTransactions={heldTransactions.heldTransactions} onRecall={handleRecallTransaction} onDelete={heldTransactions.deleteHeldTransaction} onUpdateNote={heldTransactions.updateHeldNote} onHoldCurrent={handleHoldCurrent} canHold={pos.cart.length > 0} />
              <MultiBarcodeScanner onAddProducts={handleMultiScanProducts} isOpen={multiScanOpen} onOpenChange={setMultiScanOpen} />
              {isMobile && <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                  <SheetTrigger asChild>
                    <Button className="relative">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Keranjang ({pos.cart.length})
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-96 p-0">
                    <div className="p-4">
                      <CartSidebar {...pos} onProcessTransaction={handleProcessTransaction} isOffline={!offlineMode.isOnline} heldTransactions={heldTransactions.heldTransactions} onRecallTransaction={handleRecallTransaction} onDeleteHeldTransaction={heldTransactions.deleteHeldTransaction} onHoldModalOpen={() => setHoldModalOpen(true)} />
                    </div>
                  </SheetContent>
                </Sheet>}
            </div>
          </div>
          
          <DailySalesSummary />

          <div className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-xs">
            <span className={hwMultiScan ? 'font-medium text-primary' : 'text-muted-foreground'}>
              {hwMultiScan ? `● Hardware Multi Scan Aktif · ${hwScanCount} scan` : '○ Hardware Scanner Siap'}
              {lastHwScan && <span className="ml-2 text-muted-foreground">Terakhir: {lastHwScan}</span>}
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span>Hardware Multi Scan</span>
              <Switch checked={hwMultiScan} onCheckedChange={(v) => { setHwMultiScan(v); setHwScanCount(0); setLastHwScan(null); }} />
            </label>
          </div>
          
          <ProductSearch searchTerm={pos.searchTerm} setSearchTerm={pos.setSearchTerm} handleVoiceSearch={pos.handleVoiceSearch} searchInputRef={searchInputRef} voiceSearchRef={voiceSearchRef} />
          <ProductGrid products={pos.products} isLoading={pos.isLoading} addToCart={pos.addToCart} />

          {/* Customer Favorites Button */}
          <div className="mt-6 flex justify-center">
            <Button size="lg" onClick={() => setFavoritesOpen(true)} className="w-full max-w-md bg-primary hover:bg-primary/90 text-primary-foreground">
              <Star className="h-5 w-5 mr-2" />
              Favorit Pelanggan
            </Button>
          </div>
        </div>

        {/* Cart Section - Desktop Only */}
        {!isMobile && <CartSidebar {...pos} onProcessTransaction={handleProcessTransaction} isOffline={!offlineMode.isOnline} heldTransactions={heldTransactions.heldTransactions} onRecallTransaction={handleRecallTransaction} onDeleteHeldTransaction={heldTransactions.deleteHeldTransaction} onHoldModalOpen={() => setHoldModalOpen(true)} />}
      </div>

      {/* Customer Favorites Modal */}
      <CustomerFavoritesModal open={favoritesOpen} onClose={() => setFavoritesOpen(false)} customerId={pos.selectedCustomer?.id || null} onAddToCart={pos.addToCart} />

      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={clearCartDialog} onOpenChange={setClearCartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kosongkan Keranjang?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua {pos.cart.length} item akan dihapus dari keranjang. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCart}>
              Ya, Kosongkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>;
};
export default POS;