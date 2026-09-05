import { useEffect, useRef, useState, useCallback } from "react";
import type { Html5Qrcode as Html5QrcodeType } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CustomerScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerFound: (customer: any) => void;
}

const CustomerScanner = ({ open, onOpenChange, onCustomerFound }: CustomerScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const busyRef = useRef(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      /* scanner already stopped */
    }
  }, []);

  const lookupCustomer = useCallback(
    async (raw: string) => {
      const value = raw.trim();
      // Accept plain identifier or "CUST-<id>" / "customer:<id>" style payloads
      const cleaned = value.replace(/^(cust(omer)?[-:\s]*)/i, "").trim();

      let query = supabase.from("customers").select("id, name, email, phone, total_points").limit(1);

      if (UUID_RE.test(cleaned)) {
        query = query.eq("id", cleaned);
      } else if (/^\+?\d{6,20}$/.test(cleaned.replace(/[\s-]/g, ""))) {
        query = query.eq("phone", cleaned.replace(/[\s-]/g, ""));
      } else {
        return { status: "invalid" as const };
      }

      const { data, error: qErr } = await query.maybeSingle();
      if (qErr) return { status: "error" as const };
      if (!data) return { status: "notfound" as const };
      return { status: "ok" as const, customer: data };
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    busyRef.current = false;

    const start = async () => {
      try {
        setError(null);
        await new Promise((r) => setTimeout(r, 100));
        if (cancelled) return;

        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("customer-scanner-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 180 } },
          async (decodedText) => {
            if (busyRef.current) return;
            busyRef.current = true;
            setLooking(true);
            const result = await lookupCustomer(decodedText);
            setLooking(false);

            if (result.status === "ok") {
              await stopScanner();
              onCustomerFound(result.customer);
              onOpenChange(false);
              return;
            }
            if (result.status === "invalid") setError("Barcode customer tidak valid.");
            else if (result.status === "notfound") setError("Customer tidak ditemukan.");
            else setError("Terjadi kesalahan jaringan. Coba lagi.");
            // allow another attempt
            busyRef.current = false;
          },
          () => {
            /* ignore per-frame decode errors */
          }
        );
      } catch (err: any) {
        console.error("Customer scanner error:", err);
        setError("Kamera tidak dapat digunakan. Izinkan akses kamera atau gunakan pencarian customer.");
      }
    };

    start();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [open, lookupCustomer, onCustomerFound, onOpenChange, stopScanner]);

  const handleClose = async () => {
    await stopScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : handleClose())}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm p-4">
        <DialogHeader>
          <DialogTitle className="text-base">Scan Customer</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div
            id="customer-scanner-reader"
            className="w-full min-h-[240px] bg-muted rounded-lg overflow-hidden"
          />
          {looking && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Mencari customer...
            </div>
          )}
          {error && (
            <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
              {error}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Arahkan barcode/QR customer ke kamera
          </p>
          <Button variant="outline" className="w-full" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerScanner;
