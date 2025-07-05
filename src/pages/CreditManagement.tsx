
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';
import Layout from '@/components/Layout';
import CreditStats from '@/components/credit/CreditStats';
import CreditTable from '@/components/credit/CreditTable';
import CreditSearch from '@/components/credit/CreditSearch';
import { exportCreditData } from '@/utils/excelExport';

const CreditManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const { data: creditTransactions, isLoading } = useQuery({
    queryKey: ['credit-transactions', searchTerm, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          customers(name, customer_code, phone, email),
          profiles(full_name)
        `)
        .eq('is_credit', true)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`transaction_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%`);
      }

      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const handleExportExcel = () => {
    if (creditTransactions && creditTransactions.length > 0) {
      exportCreditData(creditTransactions);
    }
  };

  const activeCredits = creditTransactions?.filter(t => t.total_amount > t.paid_amount) || [];
  const overdueCredits = activeCredits.filter(t => new Date(t.due_date) < new Date());
  const paidCredits = creditTransactions?.filter(t => t.total_amount <= t.paid_amount) || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Credit Management</h1>
          <Button onClick={handleExportExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>

        <CreditStats transactions={creditTransactions || []} />

        <CreditSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onDateRangeChange={setDateRange}
        />

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active ({activeCredits.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdueCredits.length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({paidCredits.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <CreditTable transactions={activeCredits} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="overdue">
            <CreditTable transactions={overdueCredits} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="paid">
            <CreditTable transactions={paidCredits} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CreditManagement;
