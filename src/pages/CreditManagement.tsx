
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
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl md:text-3xl font-bold text-blue-800">Manajemen Piutang</h1>
        </div>

        <EnhancedCreditStats />

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Piutang Aktif</span>
              <span className="sm:hidden">Aktif</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <History className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Riwayat Pembayaran</span>
              <span className="sm:hidden">Riwayat</span>
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
