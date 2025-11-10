import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, X } from 'lucide-react';

interface ExpenseReceiptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt_url: string | null;
  title: string;
}

const ExpenseReceiptViewer = ({ open, onOpenChange, receipt_url, title }: ExpenseReceiptViewerProps) => {
  if (!receipt_url) return null;

  const isPDF = receipt_url.toLowerCase().endsWith('.pdf') || receipt_url.includes('application/pdf');
  
  const handleDownload = () => {
    window.open(receipt_url, '_blank');
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
          ) : (
            <img 
              src={receipt_url} 
              alt={title}
              className="w-full h-auto rounded-lg"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseReceiptViewer;
