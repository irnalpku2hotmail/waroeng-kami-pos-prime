import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExpenseReceiptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt_url: string | null;
  title: string;
}

const BUCKET = 'expense-receipts';

/** Receipts live in a private bucket — resolve a short-lived signed URL for viewing. */
const extractPath = (url: string) => {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length).split('?')[0];
};

const ExpenseReceiptViewer = ({ open, onOpenChange, receipt_url, title }: ExpenseReceiptViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!open || !receipt_url) {
      setSignedUrl(null);
      return;
    }
    const path = extractPath(receipt_url);
    if (!path) {
      setSignedUrl(receipt_url);
      return;
    }
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(decodeURIComponent(path), 60 * 10)
      .then(({ data }) => {
        if (active) setSignedUrl(data?.signedUrl || null);
      });
    return () => {
      active = false;
    };
  }, [open, receipt_url]);

  if (!receipt_url) return null;

  const isPDF = receipt_url.toLowerCase().endsWith('.pdf') || receipt_url.includes('application/pdf');

  const handleDownload = () => {
    if (signedUrl) window.open(signedUrl, '_blank');
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bukti Pengeluaran - {title}</span>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative overflow-auto max-h-[70vh]">
          {isPDF ? (
            <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-lg">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">File PDF</p>
              <p className="text-sm text-muted-foreground mb-4">Klik tombol download untuk melihat file</p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          ) : signedUrl ? (
            <img 
              src={signedUrl} 
              alt={title}
              className="w-full h-auto rounded-lg"
            />
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">Memuat bukti...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseReceiptViewer;
