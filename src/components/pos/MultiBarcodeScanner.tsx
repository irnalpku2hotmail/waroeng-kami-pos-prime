import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScanBarcode, X, Check, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScannedItem {
  barcode: string;
  product: any | null;
  quantity: number;
  error?: string;
}

interface MultiBarcodeScannerProps {
  onAddProducts: (items: { product: any; quantity: number }[]) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MultiBarcodeScanner = ({ onAddProducts, isOpen: controlledIsOpen, onOpenChange }: MultiBarcodeScannerProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  
  const [error, setError] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { toast } = useToast();

  // Play beep sound using Web Audio API
  const playBeepSound = useCallback((success: boolean = true) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different tones for success/error
      oscillator.frequency.value = success ? 1200 : 400;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (err) {
      console.log('Could not play beep sound:', err);
    }
  }, []);

  // Lookup product by barcode
  const lookupProduct = useCallback(async (barcode: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, price_variants(*)')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  // Handle barcode scan
  const handleScan = useCallback(async (barcode: string) => {
    // Prevent duplicate rapid scans of same barcode
    if (barcode === lastScannedBarcode) {
      return;
    }
    setLastScannedBarcode(barcode);

    // Check if already scanned
    const existingIndex = scannedItems.findIndex(item => item.barcode === barcode);
    
    if (existingIndex >= 0) {
      // Increment quantity for existing item
      playBeepSound(true);
      setScannedItems(prev => {
        const updated = [...prev];
        if (updated[existingIndex].product) {
          updated[existingIndex].quantity += 1;
        }
        return updated;
      });
      return;
    }

    // Lookup new product
    const product = await lookupProduct(barcode);
    
    if (product) {
      playBeepSound(true);
      setScannedItems(prev => [...prev, { barcode, product, quantity: 1 }]);
    } else {
      playBeepSound(false);
      setScannedItems(prev => [...prev, { 
        barcode, 
        product: null, 
        quantity: 0, 
        error: 'Produk tidak ditemukan' 
      }]);
    }

    // Reset last scanned after delay to allow re-scanning
    setTimeout(() => setLastScannedBarcode(""), 1500);
  }, [lastScannedBarcode, scannedItems, lookupProduct, playBeepSound]);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      try {
        setError(null);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!containerRef.current) return;

        const scanner = new Html5Qrcode("multi-barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            handleScan(decodedText);
          },
          () => {}
        );
      } catch (err: any) {
        console.error("Scanner error:", err);
        setError(err?.message || "Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.");
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isOpen, handleScan]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
  };

  const handleClose = async () => {
    await stopScanner();
    setScannedItems([]);
    setLastScannedBarcode("");
    setIsOpen(false);
  };

  const handleConfirm = async () => {
    const validItems = scannedItems
      .filter(item => item.product && item.quantity > 0)
      .map(item => ({ product: item.product, quantity: item.quantity }));

    if (validItems.length > 0) {
      onAddProducts(validItems);
      toast({
        title: "Produk Ditambahkan",
        description: `${validItems.length} produk berhasil ditambahkan ke keranjang`,
      });
    }

    handleClose();
  };

  const removeScannedItem = (barcode: string) => {
    setScannedItems(prev => prev.filter(item => item.barcode !== barcode));
  };

  const updateQuantity = (barcode: string, newQuantity: number) => {
    setScannedItems(prev => prev.map(item => 
      item.barcode === barcode 
        ? { ...item, quantity: Math.max(1, newQuantity) }
        : item
    ));
  };

  const validItemsCount = scannedItems.filter(item => item.product).length;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <ScanBarcode className="h-4 w-4" />
        Multi Scan
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Multi Barcode Scanner</span>
              {validItemsCount > 0 && (
                <Badge variant="secondary">{validItemsCount} produk</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Scanner Area */}
            <div 
              ref={containerRef}
              id="multi-barcode-reader" 
              className="w-full min-h-[200px] bg-muted rounded-lg overflow-hidden"
            />
            
            {error && (
              <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              Scan barcode secara berturut-turut. Produk yang sama akan menambah jumlah.
            </p>

            {/* Scanned Items List */}
            {scannedItems.length > 0 && (
              <div className="flex-1 overflow-y-auto max-h-[200px] space-y-2">
                {scannedItems.map((item, index) => (
                  <div 
                    key={`${item.barcode}-${index}`}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      item.product ? 'bg-muted/50' : 'bg-destructive/10'
                    }`}
                  >
                    <div className="w-10 h-10 bg-background rounded flex items-center justify-center">
                      {item.product ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product?.name || item.barcode}
                      </p>
                      {item.error && (
                        <p className="text-xs text-destructive">{item.error}</p>
                      )}
                      {item.product && (
                        <p className="text-xs text-muted-foreground">
                          Rp {item.product.selling_price?.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>

                    {item.product && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.barcode, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.barcode, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeScannedItem(item.barcode)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={handleClose}
              >
                Batal
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleConfirm}
                disabled={validItemsCount === 0}
              >
                <Package className="h-4 w-4 mr-2" />
                Tambahkan ({validItemsCount})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MultiBarcodeScanner;
