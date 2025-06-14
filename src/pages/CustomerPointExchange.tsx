
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Gift, Star, Search, Clock, CheckCircle } from 'lucide-react';
import Layout from '@/components/Layout';

const CustomerPointExchange = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      
      let query = supabase
        .from('customers')
        .select('*');
      
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,customer_code.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query
        .order('name')
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: searchTerm.length > 0
  });

  // Fetch customer point history
  const { data: pointHistory = [] } = useQuery({
    queryKey: ['customer-points', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      
      const { data, error } = await supabase
        .from('point_transactions')
        .select(`
          *,
          rewards(name)
        `)
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCustomer?.id
  });

  // Fetch customer exchange history
  const { data: exchangeHistory = [] } = useQuery({
    queryKey: ['customer-exchanges', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return [];
      
      const { data, error } = await supabase
        .from('point_exchanges')
        .select(`
          *,
          rewards(name),
          profiles(full_name)
        `)
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCustomer?.id
  });

  // Fetch available rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ['available-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select(`
          *,
          reward_items (
            id,
            quantity,
            points_required,
            products (
              id,
              name,
              selling_price,
              image_url
            )
          )
        `)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const processPointExchange = useMutation({
    mutationFn: async ({ customerId, rewardId, pointsCost, quantity }: any) => {
      // Check if customer has enough points
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('total_points')
        .eq('id', customerId)
        .single();

      if (customerError) throw customerError;

      if (customer.total_points < pointsCost) {
        throw new Error('Customer tidak memiliki poin yang cukup');
      }

      // Get current reward stock
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('stock_quantity')
        .eq('id', rewardId)
        .single();

      if (rewardError) throw rewardError;

      if (reward.stock_quantity < quantity) {
        throw new Error('Stok reward tidak mencukupi');
      }

      // Create point exchange record
      const { data: exchange, error: exchangeError } = await supabase
        .from('point_exchanges')
        .insert({
          customer_id: customerId,
          reward_id: rewardId,
          points_used: pointsCost,
          quantity: quantity,
          total_points_cost: pointsCost,
          processed_by: '00000000-0000-0000-0000-000000000000' // System user
        })
        .select()
        .single();

      if (exchangeError) throw exchangeError;

      // Update customer points
      const { error: updateError } = await supabase
        .from('customers')
        .update({ total_points: customer.total_points - pointsCost })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Update reward stock
      const { error: stockError } = await supabase
        .from('rewards')
        .update({ stock_quantity: reward.stock_quantity - quantity })
        .eq('id', rewardId);

      if (stockError) throw stockError;

      // Create point transaction record
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          customer_id: customerId,
          reward_id: rewardId,
          points_change: -pointsCost,
          description: `Penukaran reward`
        });

      if (transactionError) throw transactionError;

      return exchange;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-search'] });
      queryClient.invalidateQueries({ queryKey: ['customer-points'] });
      queryClient.invalidateQueries({ queryKey: ['customer-exchanges'] });
      queryClient.invalidateQueries({ queryKey: ['available-rewards'] });
      setOpen(false);
      setSelectedReward(null);
      toast({ title: 'Berhasil', description: 'Penukaran poin berhasil diproses' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleExchange = (reward: any) => {
    const totalPointsCost = reward.reward_items?.reduce((sum: number, item: any) => sum + item.points_required, 0) || 0;
    
    processPointExchange.mutate({
      customerId: selectedCustomer.id,
      rewardId: reward.id,
      pointsCost: totalPointsCost,
      quantity: 1
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-800">Proses Penukaran Poin Customer</h1>
        </div>

        {/* Customer Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Cari Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Cari nama, kode, atau telepon customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && customers.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-gray-500">{customer.customer_code}</p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-lg">{customer.total_points}</span>
                        </div>
                        <p className="text-xs text-gray-500">Poin tersedia</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCustomer && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Info & Available Rewards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Reward Tersedia untuk {selectedCustomer.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rewards.map((reward) => {
                    const totalPoints = reward.reward_items?.reduce((sum: number, item: any) => sum + item.points_required, 0) || 0;
                    const canAfford = selectedCustomer.total_points >= totalPoints;
                    
                    return (
                      <div key={reward.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{reward.name}</h4>
                            {reward.description && (
                              <p className="text-sm text-gray-600">{reward.description}</p>
                            )}
                          </div>
                          <Badge variant={reward.stock_quantity > 0 ? "default" : "destructive"}>
                            {reward.stock_quantity} tersisa
                          </Badge>
                        </div>
                        
                        {reward.reward_items && reward.reward_items.length > 0 && (
                          <div className="text-sm space-y-1 mb-3">
                            {reward.reward_items.map((item: any) => (
                              <div key={item.id} className="flex justify-between">
                                <span>{item.quantity}x {item.products?.name}</span>
                                <span>{item.points_required} poin</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">{totalPoints} Poin</span>
                          </div>
                          <Dialog open={open && selectedReward?.id === reward.id} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setSelectedReward(reward)}
                                disabled={!canAfford || reward.stock_quantity === 0}
                                variant={canAfford ? "default" : "outline"}
                              >
                                {canAfford ? 'Tukar' : 'Poin Kurang'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Konfirmasi Penukaran Poin</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Customer</Label>
                                  <div className="font-medium">{selectedCustomer.name}</div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Reward</Label>
                                  <div className="font-medium">{reward.name}</div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Poin Yang Akan Ditukar</Label>
                                  <div className="font-bold text-red-600">{totalPoints} Poin</div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Sisa Poin Setelah Penukaran</Label>
                                  <div className="font-medium">{selectedCustomer.total_points - totalPoints} Poin</div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" onClick={() => setOpen(false)}>
                                    Batal
                                  </Button>
                                  <Button onClick={() => handleExchange(reward)}>
                                    Konfirmasi Tukar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Customer History */}
            <div className="space-y-6">
              {/* Point History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Riwayat Poin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {pointHistory.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-2 border-b">
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div className={`font-bold ${transaction.points_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Exchange History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Riwayat Penukaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {exchangeHistory.map((exchange) => (
                      <div key={exchange.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{exchange.rewards?.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(exchange.created_at).toLocaleDateString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500">
                              oleh {exchange.profiles?.full_name || 'System'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">-{exchange.points_used}</div>
                            <Badge variant="default" className="text-xs">
                              {exchange.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CustomerPointExchange;
