
import { useState } from 'react';
import Layout from '@/components/Layout';
import CreditPaymentForm from '@/components/CreditPaymentForm';
import EnhancedCreditStats from '@/components/credit/EnhancedCreditStats';
import CreditSearch from '@/components/credit/CreditSearch';
import CreditTable from '@/components/credit/CreditTable';
import CreditHistoryTab from '@/components/credit/CreditHistoryTab';
import ReminderDialog from '@/components/credit/ReminderDialog';
import { useCreditTransactions } from '@/hooks/useCreditTransactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, History } from 'lucide-react';

const CreditManagement = () => {
  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [remindDialogOpen, setRemindDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: creditTransactions, isLoading } = useCreditTransactions(searchTerm);

  const handleSendReminder = (transaction: any) => {
    setSelectedCredit(transaction);
    setRemindDialogOpen(true);
  };

  const handlePayCredit = (transaction: any) => {
    setSelectedCredit(transaction);
    setPaymentDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Manajemen Piutang Pelanggan</h1>
        </div>

        <EnhancedCreditStats />

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Piutang Aktif
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Riwayat Pembayaran
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <CreditSearch 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />

            <CreditTable
              creditTransactions={creditTransactions}
              isLoading={isLoading}
              onPayCredit={handlePayCredit}
              onSendReminder={handleSendReminder}
            />
          </TabsContent>

          <TabsContent value="history">
            <CreditHistoryTab />
          </TabsContent>
        </Tabs>

        <CreditPaymentForm
          purchase={selectedCredit}
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
        />

        <ReminderDialog
          open={remindDialogOpen}
          onOpenChange={setRemindDialogOpen}
          selectedCredit={selectedCredit}
        />
      </div>
    </Layout>
  );
};

export default CreditManagement;
