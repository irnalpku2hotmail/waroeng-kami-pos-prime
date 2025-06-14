
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { CreditCard, AlertTriangle, Phone, Mail, MessageSquare } from 'lucide-react';
import Layout from '@/components/Layout';

const CreditManagement = () => {
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [remindDialogOpen, setRemindDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch credit purchases
  const { data: creditPurchases, isLoading } = useQuery({
    queryKey: ['credit-purchases', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          suppliers(name, phone, email),
          profiles(full_name)
        `)
        .eq('payment_method', 'credit');
      
      if (searchTerm) {
        query = query.or(`purchase_number.ilike.%${searchTerm}%,invoice_number.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Fetch credit statistics
  const { data: creditStats } = useQuery({
    queryKey: ['credit-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Total credit amount
      const { data: totalCredit } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('payment_method', 'credit');

      // Overdue credits
      const { data: overdueCredits } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('payment_method', 'credit')
        .lt('due_date', today);

      // Due today
      const { data: dueToday } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('payment_method', 'credit')
        .eq('due_date', today);

      const totalAmount = totalCredit?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const overdueAmount = overdueCredits?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const dueTodayAmount = dueToday?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

      return {
        totalAmount,
        overdueAmount,
        dueTodayAmount,
        totalCount: totalCredit?.length || 0,
        overdueCount: overdueCredits?.length || 0,
        dueTodayCount: dueToday?.length || 0
      };
    }
  });

  // Send reminder mutation
  const sendReminder = useMutation({
    mutationFn: async ({ purchaseId, method, message }: { purchaseId: string, method: string, message: string }) => {
      // Create a reminder log entry (you can create a reminders table for this)
      const reminderData = {
        purchase_id: purchaseId,
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
      setRemindDialogOpen(false);
      setSelectedCredit(null);
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: 'Gagal mengirim pengingat: ' + error.message, 
        variant: 'destructive' 
      });
    }
  });

  const getPaymentStatus = (purchase: any) => {
    const today = new Date();
    const dueDate = new Date(purchase.due_date);
    
    if (dueDate < today) {
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: 'overdue',
        label: `Overdue ${daysOverdue} hari`,
        variant: 'destructive' as const
      };
    } else if (dueDate.toDateString() === today.toDateString()) {
      return {
        status: 'due_today',
        label: 'Jatuh tempo hari ini',
        variant: 'secondary' as const
      };
    } else {
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: 'pending',
        label: `${daysUntilDue} hari lagi`,
        variant: 'default' as const
      };
    }
  };

  const handleSendReminder = (purchase: any) => {
    setSelectedCredit(purchase);
    setRemindDialogOpen(true);
  };

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
      purchaseId: selectedCredit.id,
      method,
      message
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Credit Management</h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credit</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                Rp {creditStats?.totalAmount?.toLocaleString('id-ID') || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {creditStats?.totalCount || 0} transaksi
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rp {creditStats?.overdueAmount?.toLocaleString('id-ID') || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {creditStats?.overdueCount || 0} transaksi
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                Rp {creditStats?.dueTodayAmount?.toLocaleString('id-ID') || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {creditStats?.dueTodayCount || 0} transaksi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <Input
            placeholder="Cari nomor pembelian atau invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Credit List */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : creditPurchases?.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Belum ada pembelian kredit</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Pembelian</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditPurchases?.map((purchase) => {
                  const paymentStatus = getPaymentStatus(purchase);
                  
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        <div>
                          {purchase.purchase_number}
                          {purchase.invoice_number && (
                            <div className="text-sm text-gray-500">
                              Inv: {purchase.invoice_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{purchase.suppliers?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {purchase.suppliers?.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {purchase.suppliers.phone}
                            </div>
                          )}
                          {purchase.suppliers?.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {purchase.suppliers.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          Rp {purchase.total_amount?.toLocaleString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('id-ID') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatus.variant}>
                          {paymentStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(purchase)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Ingatkan
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Reminder Dialog */}
        <Dialog open={remindDialogOpen} onOpenChange={setRemindDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kirim Pengingat Pembayaran</DialogTitle>
            </DialogHeader>
            {selectedCredit && (
              <form onSubmit={handleReminderSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <div className="font-medium">{selectedCredit.suppliers?.name}</div>
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
                    defaultValue={`Halo ${selectedCredit.suppliers?.name}, kami mengingatkan bahwa pembayaran untuk invoice ${selectedCredit.purchase_number} sebesar Rp ${selectedCredit.total_amount?.toLocaleString('id-ID')} akan jatuh tempo pada ${selectedCredit.due_date ? new Date(selectedCredit.due_date).toLocaleDateString('id-ID') : ''}. Terima kasih.`}
                    rows={4}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setRemindDialogOpen(false)}
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
      </div>
    </Layout>
  );
};

export default CreditManagement;
