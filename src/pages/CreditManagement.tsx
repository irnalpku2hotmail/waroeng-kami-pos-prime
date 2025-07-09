
import { useState } from 'react';
import Layout from '@/components/Layout';
import CreditPaymentForm from '@/components/CreditPaymentForm';
import CreditStats from '@/components/credit/CreditStats';
import CreditSearch from '@/components/credit/CreditSearch';
import CreditTable from '@/components/credit/CreditTable';
import ReminderDialog from '@/components/credit/ReminderDialog';
import { useCreditTransactions } from '@/hooks/useCreditTransactions';

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

        <CreditStats />

        <CreditSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <CreditTable
          creditTransactions={creditTransactions || []}
          isLoading={isLoading}
          onPayCredit={handlePayCredit}
          onSendReminder={handleSendReminder}
        />

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
