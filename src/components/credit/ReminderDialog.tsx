
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCredit: any;
}

const ReminderDialog = ({ open, onOpenChange, selectedCredit }: ReminderDialogProps) => {
  const [reminderMessage, setReminderMessage] = useState('');

  const sendReminder = useMutation({
    mutationFn: async (data: { message: string; phone?: string }) => {
      // In a real implementation, this would integrate with WhatsApp API or SMS service
      // For now, we'll just simulate the action
      console.log('Sending reminder:', data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    },
    onSuccess: () => {
      toast({ 
        title: 'Berhasil', 
        description: 'Pengingat berhasil dikirim' 
      });
      onOpenChange(false);
      setReminderMessage('');
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'Gagal mengirim pengingat', 
        variant: 'destructive' 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderMessage.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Pesan pengingat tidak boleh kosong', 
        variant: 'destructive' 
      });
      return;
    }

    sendReminder.mutate({
      message: reminderMessage,
      phone: selectedCredit?.customers?.phone
    });
  };

  const defaultMessage = selectedCredit ? 
    `Halo ${selectedCredit.customers?.name || 'Pelanggan'},\n\nMohon untuk segera melunasi tagihan dengan detail:\n- No. Transaksi: ${selectedCredit.transaction_number}\n- Total: Rp ${selectedCredit.total_amount?.toLocaleString('id-ID')}\n- Jatuh Tempo: ${selectedCredit.due_date ? new Date(selectedCredit.due_date).toLocaleDateString('id-ID') : '-'}\n\nTerima kasih atas perhatiannya.` 
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Kirim Pengingat
          </DialogTitle>
        </DialogHeader>
        
        {selectedCredit && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Pelanggan: {selectedCredit.customers?.name || 'Guest'}
              </p>
              <p className="text-sm text-gray-600">
                No. HP: {selectedCredit.customers?.phone || 'Tidak ada'}
              </p>
              <p className="text-sm text-gray-600">
                Total Tagihan: Rp {selectedCredit.total_amount?.toLocaleString('id-ID')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reminder_message">Pesan Pengingat *</Label>
                <Textarea
                  id="reminder_message"
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  placeholder={defaultMessage}
                  rows={8}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setReminderMessage(defaultMessage)}
                >
                  Gunakan Template
                </Button>
                <Button 
                  type="submit" 
                  disabled={sendReminder.isPending}
                >
                  {sendReminder.isPending ? 'Mengirim...' : 'Kirim'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
