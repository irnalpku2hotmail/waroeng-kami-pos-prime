import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
}

const BarcodeScanner = ({ onScanSuccess }: BarcodeScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      try {
        setError(null);
        
        // Wait for the container to be available
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!containerRef.current) return;

        const scanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            onScanSuccess(decodedText);
            stopScanner();
            setIsOpen(false);
          },
          () => {
            // Ignore errors during scanning
          }
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
  }, [isOpen, onScanSuccess]);

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
    setIsOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => setIsOpen(true)}
        title="Scan Barcode"
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Scan Barcode
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div 
              ref={containerRef}
              id="barcode-reader" 
              className="w-full min-h-[300px] bg-muted rounded-lg overflow-hidden"
            />
            
            {error && (
              <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground text-center">
              Arahkan kamera ke barcode produk
            </p>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleClose}
            >
              <X className="h-4 w-4 mr-2" />
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BarcodeScanner;
