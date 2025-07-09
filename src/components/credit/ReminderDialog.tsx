
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCredit: any;
}

const ReminderDialog = ({ open, onOpenChange, selectedCredit }: ReminderDialogProps) => {
  const sendReminder = useMutation({
    mutationFn: async ({ transactionId, method, message }: { transactionId: string, method: string, message: string }) => {
      // Create a reminder log entry (you can create a reminders table for this)
      const reminderData = {
        transaction_id: transactionId,
        method: method,
        message: message,
        sent_at: new Date().toISOString(),
        status: 'sent'
      };

      // For now, we'll just log it in the console and show success
      console.log('Reminder sent:', reminderData);
      
      // In a real implementation, you would:
      // 1. Send SMS via a service like Twilio
      // 2. Send email via a service like SendGrid
      // 3. Send WhatsApp message via WhatsApp Business API
      
      return reminderData;
    },
    onSuccess: () => {
      toast({ 
        title: 'Berhasil', 
        description: 'Pengingat berhasil dikirim',
        duration: 3000
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'Gagal mengirim pengingat: ' + error.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleReminderSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const method = formData.get('method') as string;
    const message = formData.get('message') as string;
    
    if (!method || !message) {
      toast({ 
        title: 'Error', 
        description: 'Pilih metode dan masukkan pesan pengingat', 
        variant: 'destructive' 
      });
      return;
    }

    sendReminder.mutate({
      transactionId: selectedCredit.id,
      method,
      message
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kirim Pengingat Pembayaran</DialogTitle>
        </DialogHeader>
        {selectedCredit && (
          <form onSubmit={handleReminderSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pelanggan</Label>
              <div className="font-medium">{selectedCredit.customers?.name || 'Customer Umum'}</div>
            </div>
            <div className="space-y-2">
              <Label>Total Tagihan</Label>
              <div className="font-bold text-red-600">
                Rp {selectedCredit.total_amount?.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Jatuh Tempo</Label>
              <div className="font-medium">
                {selectedCredit.due_date ? new Date(selectedCredit.due_date).toLocaleDateString('id-ID') : '-'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Metode Pengingat</Label>
              <select 
                id="method" 
                name="method" 
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              >
                <option value="">Pilih metode</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Pesan Pengingat</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Masukkan pesan pengingat..."
                defaultValue={`Halo ${selectedCredit.customers?.name || 'Customer'}, kami mengingatkan bahwa pembayaran untuk transaksi ${selectedCredit.transaction_number} sebesar Rp ${selectedCredit.total_amount?.toLocaleString('id-ID')} akan jatuh tempo pada ${selectedCredit.due_date ? new Date(selectedCredit.due_date).toLocaleDateString('id-ID') : ''}. Terima kasih.`}
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={sendReminder.isPending}>
                {sendReminder.isPending ? 'Mengirim...' : 'Kirim Pengingat'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
