import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Plus, Gift, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import { exportPointsRewardsData } from '@/utils/excelExport';

const PointsRewards = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: pointTransactions } = useQuery({
    queryKey: ['point-transactions', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          customers(name, customer_code, total_points)
        `)
        .gt('points_earned', 0)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`transaction_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: rewards } = useQuery({
    queryKey: ['rewards', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('rewards')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const handleExportExcel = () => {
    if (pointTransactions && rewards) {
      exportPointsRewardsData(pointTransactions, rewards);
    }
  };

  const totalPointsEarned = pointTransactions?.reduce((sum, t) => sum + t.points_earned, 0) || 0;
  const activeRewardsCount = rewards?.filter(r => r.is_active).length || 0;
  const totalRewardsCount = rewards?.length || 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Points & Rewards Management</h1>
          <div className="flex gap-2">
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Reward
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pointTransactions?.reduce((sum, t) => sum + t.points_earned, 0) || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rewards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rewards?.filter(r => r.is_active).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rewards?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="Search transactions or rewards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList>
            <TabsTrigger value="transactions">Point Transactions</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions">
            <div className="border rounded-lg">
              {/* Implement transaction table here */}
              {pointTransactions ? (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="py-2">Transaction Number</th>
                      <th className="py-2">Customer</th>
                      <th className="py-2">Points Earned</th>
                      <th className="py-2">Transaction Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointTransactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td className="py-2">{transaction.transaction_number}</td>
                        <td className="py-2">{transaction.customers?.name}</td>
                        <td className="py-2">{transaction.points_earned}</td>
                        <td className="py-2">{new Date(transaction.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>Loading transactions...</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="rewards">
            <div className="border rounded-lg">
              {/* Implement rewards table here */}
              {rewards ? (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="py-2">Reward Name</th>
                      <th className="py-2">Description</th>
                      <th className="py-2">Stock Quantity</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.map(reward => (
                      <tr key={reward.id}>
                        <td className="py-2">{reward.name}</td>
                        <td className="py-2">{reward.description}</td>
                        <td className="py-2">{reward.stock_quantity}</td>
                        <td className="py-2">{reward.is_active ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>Loading rewards...</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PointsRewards;
